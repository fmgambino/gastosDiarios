/**
 * Gastos Diarios + Google Sheets
 * Web App backend para login, listado, alta, edición y borrado.
 *
 * Uso recomendado:
 * 1) Crear una Google Sheet vacía.
 * 2) Abrir Extensiones > Apps Script.
 * 3) Pegar este archivo como Code.gs
 * 4) Deploy > New deployment > Web app
 * 5) Ejecutar setupSheets_() una vez manualmente.
 * 6) Copiar la URL del Web App en script.js => CONFIG.APPS_SCRIPT_URL
 */

const SPREADSHEET_ID = ""; // Opcional. Si dejás vacío usa la Sheet enlazada al script.
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin342$$=";
const SESSION_TTL_SECONDS = 60 * 60 * 6; // 6 horas

const SHEETS = {
  REGISTROS: "Registros",
  CATEGORIAS: "Categorias",
  CONFIG: "Config",
};

function doGet(e) {
  const payload = e && e.parameter ? e.parameter : {};
  return route_(payload);
}

function doPost(e) {
  let payload = {};
  try {
    payload = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
  } catch (error) {
    payload = e && e.parameter ? e.parameter : {};
  }
  return route_(payload);
}

function route_(payload) {
  const callback = payload.callback;

  try {
    setupSheets_();
    const action = String(payload.action || "health").toLowerCase();

    switch (action) {
      case "health":
        return json_({ ok: true, app: "Gastos Diarios", timestamp: new Date().toISOString() }, callback);

      case "login":
        return login_(payload, callback);

      case "list":
        assertAuth_(payload.token);
        return list_(payload, callback);

      case "categories":
        assertAuth_(payload.token);
        return json_({ ok: true, categories: getCategories_() }, callback);

      case "upsert":
        assertAuth_(payload.token);
        return upsert_(payload, callback);

      case "delete":
        assertAuth_(payload.token);
        return delete_(payload, callback);

      default:
        return json_({ ok: false, message: "Acción no válida." }, callback);
    }
  } catch (error) {
    return json_({
      ok: false,
      message: error && error.message ? error.message : "Error desconocido",
      stack: error && error.stack ? String(error.stack) : "",
    }, callback);
  }
}

function json_(data, callback) {
  const safeCallback = sanitizeCallback_(callback);
  const output = safeCallback
    ? safeCallback + '(' + JSON.stringify(data) + ')'
    : JSON.stringify(data);

  return ContentService
    .createTextOutput(output)
    .setMimeType(safeCallback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function sanitizeCallback_(callback) {
  const value = String(callback || '').trim();
  if (!value) return '';
  return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(value) ? value : '';
}

function getSpreadsheet_() {
  return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_(name) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function setupSheets_() {
  const registros = getSheet_(SHEETS.REGISTROS);
  const categorias = getSheet_(SHEETS.CATEGORIAS);
  const config = getSheet_(SHEETS.CONFIG);

  if (registros.getLastRow() === 0) {
    registros.getRange(1, 1, 1, 11).setValues([[
      "ID",
      "FechaHora",
      "Detalle",
      "Categoria",
      "Cantidad",
      "PrecioUnitario",
      "Moneda",
      "Total",
      "Movimiento",
      "CreatedAt",
      "UpdatedAt"
    ]]);
    registros.setFrozenRows(1);
  }

  if (categorias.getLastRow() === 0) {
    categorias.getRange(1, 1, 1, 1).setValues([["Categoria"]]);
    categorias.getRange(2, 1, 7, 1).setValues([
      ["💰 Sueldo"],
      ["💡 Luz"],
      ["🛒 Supermercado"],
      ["🚕 Transporte"],
      ["🏦 Ahorro"],
      ["📶 Internet"],
      ["🍽️ Comida"]
    ]);
    categorias.setFrozenRows(1);
  }

  if (config.getLastRow() === 0) {
    config.getRange(1, 1, 4, 2).setValues([
      ["Clave", "Valor"],
      ["SaldoFormula", "Ingresos - Egresos - Ahorro"],
      ["AdminUser", ADMIN_USER],
      ["MonedaDashboard", "USD"]
    ]);
    config.setFrozenRows(1);
  }
}

function login_(payload, callback) {
  const username = String(payload.username || "").trim();
  const password = String(payload.password || "");

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    throw new Error("Usuario o contraseña incorrectos.");
  }

  const token = Utilities.getUuid();
  CacheService.getScriptCache().put(token, username, SESSION_TTL_SECONDS);

  return json_({
    ok: true,
    token,
    user: username,
    expiresInSeconds: SESSION_TTL_SECONDS
  }, callback);
}

function assertAuth_(token) {
  const sessionUser = CacheService.getScriptCache().get(String(token || ""));
  if (!sessionUser) {
    throw new Error("Sesión expirada o no válida.");
  }
  return sessionUser;
}

function list_(payload, callback) {
  const records = getRecords_();
  const filtered = applyFilters_(records, payload);
  const summary = summarize_(filtered);

  return json_({
    ok: true,
    records: filtered,
    categories: getCategories_(),
    summary
  }, callback);
}

function upsert_(payload, callback) {
  const sheet = getSheet_(SHEETS.REGISTROS);
  const record = normalizeRecord_(payload);
  const nowIso = new Date().toISOString();

  const data = sheet.getDataRange().getValues();
  let targetRow = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === record.id) {
      targetRow = i + 1;
      break;
    }
  }

  const rowValues = [[
    record.id,
    record.fechaHora,
    record.detalle,
    record.categoria,
    record.cantidad,
    record.precioUnitario,
    record.moneda,
    record.total,
    record.movimiento,
    targetRow === -1 ? nowIso : data[targetRow - 1][9],
    nowIso
  ]];

  if (targetRow === -1) {
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, 11).setValues(rowValues);
  } else {
    sheet.getRange(targetRow, 1, 1, 11).setValues(rowValues);
  }

  ensureCategory_(record.categoria);

  return json_({
    ok: true,
    message: "Registro guardado correctamente.",
    record
  }, callback);
}

function delete_(payload, callback) {
  const id = String(payload.id || "");
  if (!id) throw new Error("Falta el ID a eliminar.");

  const sheet = getSheet_(SHEETS.REGISTROS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return json_({ ok: true, message: "Registro eliminado." }, callback);
    }
  }

  throw new Error("No se encontró el registro a eliminar.");
}

function getRecords_() {
  const sheet = getSheet_(SHEETS.REGISTROS);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) return [];

  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;

    rows.push({
      id: String(row[0] || ""),
      fechaHora: String(row[1] || ""),
      detalle: String(row[2] || ""),
      categoria: String(row[3] || ""),
      cantidad: Number(row[4] || 0),
      precioUnitario: Number(row[5] || 0),
      moneda: String(row[6] || "USD"),
      total: Number(row[7] || 0),
      movimiento: String(row[8] || "Egreso")
    });
  }

  rows.sort(function(a, b) {
    return new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime();
  });

  return rows;
}

function getCategories_() {
  const sheet = getSheet_(SHEETS.CATEGORIAS);
  const values = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 1).getValues();
  return values
    .map(function(row) { return String(row[0] || "").trim(); })
    .filter(Boolean)
    .sort();
}

function ensureCategory_(category) {
  const value = String(category || "").trim();
  if (!value) return;

  const categories = getCategories_();
  if (categories.indexOf(value) !== -1) return;

  const sheet = getSheet_(SHEETS.CATEGORIAS);
  sheet.getRange(sheet.getLastRow() + 1, 1).setValue(value);
}

function normalizeRecord_(payload) {
  const cantidad = Number(payload.cantidad || 0);
  const precioUnitario = Number(payload.precioUnitario || 0);

  return {
    id: String(payload.id || ("GD-" + new Date().getTime())),
    fechaHora: String(payload.fechaHora || new Date().toISOString().slice(0, 16)),
    detalle: String(payload.detalle || "").trim(),
    categoria: String(payload.categoria || "").trim(),
    cantidad: cantidad,
    precioUnitario: precioUnitario,
    moneda: String(payload.moneda || "USD"),
    total: Number(payload.total || (cantidad * precioUnitario)),
    movimiento: String(payload.movimiento || "Egreso")
  };
}

function applyFilters_(records, payload) {
  let result = records.slice();
  const period = String(payload.period || "30");
  const category = String(payload.category || "").trim();
  const detail = String(payload.detail || "").trim().toLowerCase();
  const search = String(payload.search || "").trim().toLowerCase();
  const from = payload.from ? new Date(String(payload.from) + "T00:00") : null;
  const to = payload.to ? new Date(String(payload.to) + "T23:59") : null;
  const now = new Date();

  if (period === "7" || period === "30") {
    const days = Number(period);
    const limit = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    result = result.filter(function(item) {
      return new Date(item.fechaHora).getTime() >= limit.getTime();
    });
  }

  if (period === "custom") {
    result = result.filter(function(item) {
      const date = new Date(item.fechaHora);
      if (from && date.getTime() < from.getTime()) return false;
      if (to && date.getTime() > to.getTime()) return false;
      return true;
    });
  }

  if (category) {
    result = result.filter(function(item) {
      return item.categoria === category;
    });
  }

  if (detail) {
    result = result.filter(function(item) {
      return item.detalle.toLowerCase().indexOf(detail) !== -1;
    });
  }

  if (search) {
    result = result.filter(function(item) {
      const haystack = [item.id, item.detalle, item.categoria, item.moneda].join(" ").toLowerCase();
      return haystack.indexOf(search) !== -1;
    });
  }

  result.sort(function(a, b) {
    return new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime();
  });

  return result;
}

function summarize_(records) {
  const summary = {
    ingresos: 0,
    egresos: 0,
    ahorro: 0,
    saldo: 0
  };

  records.forEach(function(item) {
    const total = Number(item.total || 0);
    if (item.movimiento === "Ingreso") summary.ingresos += total;
    if (item.movimiento === "Egreso") summary.egresos += total;
    if (item.movimiento === "Ahorro") summary.ahorro += total;
  });

  summary.saldo = summary.ingresos - summary.egresos - summary.ahorro;
  return summary;
}
