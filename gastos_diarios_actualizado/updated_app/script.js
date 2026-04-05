const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxWgMT1XYBLuLrEqF7J2MzOFOryB7ADI15uvFBM5ZP9ERwg8uNIKGPtZo1LCttvoZgx/exec",
  STORAGE_THEME: "gd-theme",
  STORAGE_DEMO_DB: "gd-demo-db",
  STORAGE_TOKEN: "gd-token",
  STORAGE_USER: "gd-user",
  STORAGE_PROFILE_IMAGE: "gd-profile-image",
  DOLAR_BLUE_API_URL: "https://dolarapi.com/v1/dolares/blue",
};

const DEMO_CREDENTIALS = {
  username: "admin",
  password: "admin342$$=",
};

const MOVEMENT_LABELS = {
  Ingreso: "sub-tag sub-tag--ingreso",
  Egreso: "sub-tag sub-tag--egreso",
  Ahorro: "sub-tag sub-tag--ahorro",
};

const ICONS = {
  view: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`,
};

const state = {
  token: sessionStorage.getItem(CONFIG.STORAGE_TOKEN) || "",
  user: sessionStorage.getItem(CONFIG.STORAGE_USER) || "Administrador",
  theme: localStorage.getItem(CONFIG.STORAGE_THEME) || "dark",
  profileImage: localStorage.getItem(CONFIG.STORAGE_PROFILE_IMAGE) || "assets/avatar-default.svg",
  categories: [],
  records: [],
  summary: emptySummary(),
  modalMode: "create",
  currentRecordId: "",
  blueRate: {
    venta: null,
    compra: null,
    fechaActualizacion: "",
    source: "DolarApi",
    status: "idle",
  },
};

const dom = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindDom();
  bindEvents();
  applyTheme(state.theme);
  initDemoStorage();
  renderProfile();

  if (state.token) {
    showDashboard();
    loadDashboard();
  } else {
    showLogin();
  }
}

function bindDom() {
  dom.body = document.body;
  dom.root = document.documentElement;

  dom.loginScreen = document.getElementById("loginScreen");
  dom.dashboardScreen = document.getElementById("dashboardScreen");
  dom.loginForm = document.getElementById("loginForm");
  dom.loginMessage = document.getElementById("loginMessage");
  dom.username = document.getElementById("username");
  dom.password = document.getElementById("password");

  dom.themeToggle = document.getElementById("themeToggle");
  dom.fullscreenToggle = document.getElementById("fullscreenToggle");
  dom.logoutBtn = document.getElementById("logoutBtn");
  dom.profileName = document.getElementById("profileName");
  dom.profileImage = document.getElementById("profileImage");
  dom.profileImageButton = document.getElementById("profileImageButton");
  dom.profileImageInput = document.getElementById("profileImageInput");

  dom.filtersToggleBtn = document.getElementById("filtersToggleBtn");
  dom.filtersForm = document.getElementById("filtersForm");
  dom.periodFilter = document.getElementById("periodFilter");
  dom.customDates = document.getElementById("customDates");
  dom.fromFilter = document.getElementById("fromFilter");
  dom.toFilter = document.getElementById("toFilter");
  dom.categoryFilter = document.getElementById("categoryFilter");
  dom.detailFilter = document.getElementById("detailFilter");
  dom.searchFilter = document.getElementById("searchFilter");
  dom.clearFiltersBtn = document.getElementById("clearFiltersBtn");
  dom.refreshBtn = document.getElementById("refreshBtn");

  dom.incomeValueARS = document.getElementById("incomeValueARS");
  dom.incomeValueUSD = document.getElementById("incomeValueUSD");
  dom.expenseValueARS = document.getElementById("expenseValueARS");
  dom.expenseValueUSD = document.getElementById("expenseValueUSD");
  dom.balanceValueARS = document.getElementById("balanceValueARS");
  dom.balanceValueUSD = document.getElementById("balanceValueUSD");
  dom.savingValueARS = document.getElementById("savingValueARS");
  dom.savingValueUSD = document.getElementById("savingValueUSD");
  dom.balanceBlueInfo = document.getElementById("balanceBlueInfo");

  dom.tableCount = document.getElementById("tableCount");
  dom.recordsTableBody = document.getElementById("recordsTableBody");

  dom.openModalBtn = document.getElementById("openModalBtn");
  dom.recordModal = document.getElementById("recordModal");
  dom.modalTitle = document.getElementById("modalTitle");
  dom.modalSubtitle = document.getElementById("modalSubtitle");
  dom.recordForm = document.getElementById("recordForm");
  dom.formMessage = document.getElementById("formMessage");
  dom.saveRecordBtn = document.getElementById("saveRecordBtn");

  dom.recordId = document.getElementById("recordId");
  dom.recordDateTime = document.getElementById("recordDateTime");
  dom.recordDetail = document.getElementById("recordDetail");
  dom.recordCategory = document.getElementById("recordCategory");
  dom.recordMovement = document.getElementById("recordMovement");
  dom.recordQuantity = document.getElementById("recordQuantity");
  dom.recordUnitPrice = document.getElementById("recordUnitPrice");
  dom.recordCurrency = document.getElementById("recordCurrency");
  dom.recordTotal = document.getElementById("recordTotal");
  dom.categoriesList = document.getElementById("categoriesList");
}

function bindEvents() {
  dom.loginForm?.addEventListener("submit", handleLogin);
  dom.themeToggle?.addEventListener("click", toggleTheme);
  dom.fullscreenToggle?.addEventListener("click", toggleFullscreen);
  dom.logoutBtn?.addEventListener("click", handleLogout);
  dom.profileImageButton?.addEventListener("click", () => dom.profileImageInput?.click());
  dom.profileImageInput?.addEventListener("change", handleProfileImageChange);
  document.addEventListener("fullscreenchange", updateFullscreenIconState);

  dom.filtersToggleBtn?.addEventListener("click", toggleFilters);
  dom.periodFilter?.addEventListener("change", toggleCustomDates);

  dom.filtersForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    loadDashboard();
  });

  dom.clearFiltersBtn?.addEventListener("click", clearFilters);
  dom.refreshBtn?.addEventListener("click", loadDashboard);
  dom.openModalBtn?.addEventListener("click", () => openRecordModal("create"));

  dom.recordForm?.addEventListener("submit", handleSaveRecord);
  dom.recordQuantity?.addEventListener("input", calculateTotal);
  dom.recordUnitPrice?.addEventListener("input", calculateTotal);

  dom.recordsTableBody?.addEventListener("click", handleTableAction);

  document.querySelectorAll("[data-close-modal='true']").forEach((button) => {
    button.addEventListener("click", closeRecordModal);
  });

  dom.recordModal?.addEventListener("click", (event) => {
    if (event.target === dom.recordModal) closeRecordModal();
  });
}

function initDemoStorage() {
  const current = loadDemoDB();
  if (current) return;

  const now = new Date();
  const mock = {
    categories: ["💰 Sueldo", "💡 Luz", "🛒 Supermercado", "🚕 Transporte", "🏦 Ahorro", "📶 Internet", "🍽️ Comida"],
    records: [
      {
        id: `GD-${Date.now() - 50000}`,
        fechaHora: toDatetimeLocalValue(now),
        detalle: "Cobro de servicios",
        categoria: "💰 Sueldo",
        cantidad: 1,
        precioUnitario: 1800,
        moneda: "USD",
        total: 1800,
        movimiento: "Ingreso",
      },
      {
        id: `GD-${Date.now() - 40000}`,
        fechaHora: toDatetimeLocalValue(new Date(now.getTime() - 3600000)),
        detalle: "Honorarios cliente local",
        categoria: "💰 Sueldo",
        cantidad: 1,
        precioUnitario: 1450000,
        moneda: "ARS",
        total: 1450000,
        movimiento: "Ingreso",
      },
      {
        id: `GD-${Date.now() - 30000}`,
        fechaHora: toDatetimeLocalValue(new Date(now.getTime() - 86400000)),
        detalle: "Pago de supermercado",
        categoria: "🛒 Supermercado",
        cantidad: 1,
        precioUnitario: 180,
        moneda: "USD",
        total: 180,
        movimiento: "Egreso",
      },
      {
        id: `GD-${Date.now() - 20000}`,
        fechaHora: toDatetimeLocalValue(new Date(now.getTime() - 86400000 * 2)),
        detalle: "Servicios hogar",
        categoria: "💡 Luz",
        cantidad: 1,
        precioUnitario: 96500,
        moneda: "ARS",
        total: 96500,
        movimiento: "Egreso",
      },
      {
        id: `GD-${Date.now() - 10000}`,
        fechaHora: toDatetimeLocalValue(new Date(now.getTime() - 86400000 * 3)),
        detalle: "Reserva mensual",
        categoria: "🏦 Ahorro",
        cantidad: 1,
        precioUnitario: 250,
        moneda: "USD",
        total: 250,
        movimiento: "Ahorro",
      },
      {
        id: `GD-${Date.now() - 5000}`,
        fechaHora: toDatetimeLocalValue(new Date(now.getTime() - 86400000 * 4)),
        detalle: "Caja de ahorro",
        categoria: "🏦 Ahorro",
        cantidad: 1,
        precioUnitario: 220000,
        moneda: "ARS",
        total: 220000,
        movimiento: "Ahorro",
      },
    ],
  };

  localStorage.setItem(CONFIG.STORAGE_DEMO_DB, JSON.stringify(mock));
}

function loadDemoDB() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_DEMO_DB));
  } catch (error) {
    console.error("Error leyendo demo DB", error);
    return null;
  }
}

function saveDemoDB(data) {
  localStorage.setItem(CONFIG.STORAGE_DEMO_DB, JSON.stringify(data));
}

function showLogin() {
  dom.loginScreen?.classList.add("screen--active");
  dom.dashboardScreen?.classList.remove("screen--active");
}

function showDashboard() {
  dom.dashboardScreen?.classList.add("screen--active");
  dom.loginScreen?.classList.remove("screen--active");
}

async function handleLogin(event) {
  event.preventDefault();

  const username = dom.username.value.trim();
  const password = dom.password.value;

  if (!username || !password) {
    setMessage(dom.loginMessage, "Ingresá usuario y contraseña.", true);
    return;
  }

  try {
    setMessage(dom.loginMessage, "Validando acceso...", false);
    const response = await api("login", { username, password }, false);

    state.token = response.token || "";
    state.user = response.user || username;

    sessionStorage.setItem(CONFIG.STORAGE_TOKEN, state.token);
    sessionStorage.setItem(CONFIG.STORAGE_USER, state.user);

    renderProfile();
    setMessage(dom.loginMessage, "Acceso correcto.", false);
    dom.loginForm.reset();

    showDashboard();
    await loadDashboard();
  } catch (error) {
    console.error(error);
    setMessage(dom.loginMessage, error.message || "No fue posible iniciar sesión.", true);
  }
}

function handleLogout() {
  sessionStorage.removeItem(CONFIG.STORAGE_TOKEN);
  sessionStorage.removeItem(CONFIG.STORAGE_USER);
  state.token = "";
  state.user = "Administrador";
  renderProfile();
  showLogin();
}

function renderProfile() {
  if (dom.profileName) dom.profileName.textContent = state.user || "Administrador";
  if (dom.profileImage) dom.profileImage.src = state.profileImage || "assets/avatar-default.svg";
}

function handleProfileImageChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result || "");
    state.profileImage = result;
    localStorage.setItem(CONFIG.STORAGE_PROFILE_IMAGE, result);
    renderProfile();
  };
  reader.readAsDataURL(file);
}

function toggleTheme() {
  applyTheme(state.theme === "dark" ? "light" : "dark");
}

function applyTheme(theme) {
  state.theme = theme;
  dom.root?.setAttribute("data-theme", theme);
  localStorage.setItem(CONFIG.STORAGE_THEME, theme);
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.error("No fue posible cambiar pantalla completa", error);
  }
}

function updateFullscreenIconState() {
  const label = document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa";
  if (dom.fullscreenToggle) {
    dom.fullscreenToggle.setAttribute("aria-label", label);
    dom.fullscreenToggle.setAttribute("title", label);
  }
}

function toggleFilters() {
  if (window.innerWidth <= 1080) {
    dom.body.classList.toggle("filters-open");
    return;
  }
  dom.body.classList.toggle("filters-collapsed");
}

function toggleCustomDates() {
  dom.customDates?.classList.toggle("hidden", dom.periodFilter.value !== "custom");
}

function clearFilters() {
  dom.periodFilter.value = "30";
  dom.fromFilter.value = "";
  dom.toFilter.value = "";
  dom.categoryFilter.value = "";
  dom.detailFilter.value = "";
  dom.searchFilter.value = "";
  toggleCustomDates();
  loadDashboard();
}

async function loadDashboard() {
  try {
    const filters = collectFilters();
    const response = await api("list", filters);

    state.records = Array.isArray(response.records) ? response.records : [];
    state.categories = Array.isArray(response.categories) ? response.categories : [];
    state.summary = summarizeRecords(state.records);

    renderCategories();
    renderStats();
    renderTable();

    if (window.innerWidth <= 1080) {
      dom.body.classList.remove("filters-open");
    }

    fetchBlueRate();
  } catch (error) {
    console.error(error);

    if (/sesión expirada|sesión no válida/i.test(error.message || "")) {
      handleLogout();
      return;
    }

    alert(error.message || "No se pudieron cargar los registros.");
  }
}

function collectFilters() {
  return {
    period: dom.periodFilter?.value || "30",
    from: dom.fromFilter?.value || "",
    to: dom.toFilter?.value || "",
    category: dom.categoryFilter?.value || "",
    detail: dom.detailFilter?.value.trim() || "",
    search: dom.searchFilter?.value.trim() || "",
  };
}

function renderCategories() {
  const uniqueCategories = ["", ...new Set(state.categories.filter(Boolean))];

  dom.categoryFilter.innerHTML = uniqueCategories
    .map((category) => `<option value="${escapeHtml(category)}">${category || "Todas"}</option>`)
    .join("");

  dom.categoriesList.innerHTML = [...new Set(state.categories.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .map((category) => `<option value="${escapeHtml(category)}"></option>`)
    .join("");
}

function renderStats() {
  const ars = state.summary.ARS;
  const usd = state.summary.USD;

  dom.incomeValueARS.textContent = formatCurrency(ars.ingresos, "ARS");
  dom.incomeValueUSD.textContent = formatCurrency(usd.ingresos, "USD");
  dom.expenseValueARS.textContent = formatCurrency(ars.egresos, "ARS");
  dom.expenseValueUSD.textContent = formatCurrency(usd.egresos, "USD");
  dom.balanceValueARS.textContent = formatCurrency(ars.saldo, "ARS");
  dom.balanceValueUSD.textContent = formatCurrency(usd.saldo, "USD");
  dom.savingValueARS.textContent = formatCurrency(ars.ahorro, "ARS");
  dom.savingValueUSD.textContent = formatCurrency(usd.ahorro, "USD");

  renderBlueInfo();
}

function renderBlueInfo() {
  if (!dom.balanceBlueInfo) return;

  if (!Number.isFinite(state.blueRate.venta)) {
    dom.balanceBlueInfo.textContent = "Cotización Blue no disponible por el momento.";
    return;
  }

  const usdBalance = Number(state.summary.USD.saldo || 0);
  const arsPesified = usdBalance * state.blueRate.venta;
  const updated = formatDateTime(state.blueRate.fechaActualizacion);

  dom.balanceBlueInfo.textContent = `Dólar Blue venta ${formatCurrency(state.blueRate.venta, "ARS")} · Saldo USD pesificado: ${formatCurrency(arsPesified, "ARS")} · Actualizado: ${updated}`;
}

async function fetchBlueRate() {
  state.blueRate.status = "loading";
  renderBlueInfo();

  try {
    const response = await fetch(CONFIG.DOLAR_BLUE_API_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    state.blueRate = {
      venta: Number(data.venta || 0),
      compra: Number(data.compra || 0),
      fechaActualizacion: data.fechaActualizacion || data.fecha || "",
      source: "DolarApi",
      status: "ready",
    };
  } catch (error) {
    console.error("Error consultando dólar blue", error);
    state.blueRate = {
      venta: null,
      compra: null,
      fechaActualizacion: "",
      source: "DolarApi",
      status: "error",
    };
  }

  renderBlueInfo();
}

function renderTable() {
  dom.tableCount.textContent = `${state.records.length} registro${state.records.length === 1 ? "" : "s"}`;

  if (!state.records.length) {
    dom.recordsTableBody.innerHTML = `<tr><td colspan="9" class="empty-state">Sin registros cargados.</td></tr>`;
    return;
  }

  dom.recordsTableBody.innerHTML = state.records
    .map((record) => {
      const movementClass = MOVEMENT_LABELS[record.movimiento] || MOVEMENT_LABELS.Egreso;

      return `
        <tr>
          <td>${escapeHtml(record.id)}</td>
          <td>${escapeHtml(formatDateTime(record.fechaHora))}</td>
          <td>
            <strong>${escapeHtml(record.detalle)}</strong>
            <span class="${movementClass}">${escapeHtml(record.movimiento || "Egreso")}</span>
          </td>
          <td>${escapeHtml(record.categoria)}</td>
          <td>${formatNumber(record.cantidad)}</td>
          <td>${formatCurrency(record.precioUnitario, record.moneda)}</td>
          <td>${escapeHtml(record.moneda)}</td>
          <td>${formatCurrency(record.total, record.moneda)}</td>
          <td>
            <div class="actions">
              <button class="icon-button action-btn" data-action="view" data-id="${escapeHtml(record.id)}" aria-label="Ver">${ICONS.view}</button>
              <button class="icon-button action-btn" data-action="edit" data-id="${escapeHtml(record.id)}" aria-label="Editar">${ICONS.edit}</button>
              <button class="icon-button icon-button--danger action-btn" data-action="delete" data-id="${escapeHtml(record.id)}" aria-label="Eliminar">${ICONS.delete}</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function handleTableAction(event) {
  const button = event.target.closest(".action-btn");
  if (!button) return;

  const { action, id } = button.dataset;
  const record = state.records.find((item) => item.id === id);
  if (!record) return;

  if (action === "view") openRecordModal("view", record);
  if (action === "edit") openRecordModal("edit", record);
  if (action === "delete") deleteRecord(record);
}

function openRecordModal(mode, record = null) {
  state.modalMode = mode;
  state.currentRecordId = record?.id || "";

  const readOnly = mode === "view";

  dom.modalTitle.textContent =
    mode === "create" ? "Nuevo registro" : mode === "edit" ? "Editar registro" : "Ver registro";

  dom.modalSubtitle.textContent =
    mode === "create"
      ? "Carga de movimiento"
      : mode === "edit"
      ? "Actualización de movimiento"
      : "Consulta de movimiento";

  dom.saveRecordBtn.classList.toggle("hidden", readOnly);

  const id = record?.id || generateId();
  const fechaHora = record?.fechaHora || toDatetimeLocalValue(new Date());
  const detalle = record?.detalle || "";
  const categoria = record?.categoria || "";
  const movimiento = record?.movimiento || "Egreso";
  const cantidad = record?.cantidad ?? 1;
  const precioUnitario = record?.precioUnitario ?? 0;
  const moneda = record?.moneda || "USD";
  const total = record?.total ?? Number(cantidad) * Number(precioUnitario);

  dom.recordId.value = id;
  dom.recordDateTime.value = fechaHora;
  dom.recordDetail.value = detalle;
  dom.recordCategory.value = categoria;
  dom.recordMovement.value = movimiento;
  dom.recordQuantity.value = cantidad;
  dom.recordUnitPrice.value = precioUnitario;
  dom.recordCurrency.value = moneda;
  dom.recordTotal.value = Number(total).toFixed(2);

  setFormReadOnly(readOnly);
  setMessage(dom.formMessage, "", false);

  dom.recordModal.classList.remove("hidden");
}

function closeRecordModal() {
  dom.recordModal.classList.add("hidden");
  dom.recordForm.reset();
  dom.recordTotal.value = "";
  setFormReadOnly(false);
  setMessage(dom.formMessage, "", false);
}

function setFormReadOnly(readOnly) {
  [
    dom.recordDateTime,
    dom.recordDetail,
    dom.recordCategory,
    dom.recordMovement,
    dom.recordQuantity,
    dom.recordUnitPrice,
    dom.recordCurrency,
  ].forEach((field) => {
    if (field) field.disabled = readOnly;
  });
}

function calculateTotal() {
  const quantity = Number(dom.recordQuantity.value || 0);
  const unitPrice = Number(dom.recordUnitPrice.value || 0);
  dom.recordTotal.value = (quantity * unitPrice).toFixed(2);
}

async function handleSaveRecord(event) {
  event.preventDefault();
  calculateTotal();

  const payload = {
    id: dom.recordId.value.trim(),
    fechaHora: dom.recordDateTime.value,
    detalle: dom.recordDetail.value.trim(),
    categoria: dom.recordCategory.value.trim(),
    movimiento: dom.recordMovement.value,
    cantidad: Number(dom.recordQuantity.value || 0),
    precioUnitario: Number(dom.recordUnitPrice.value || 0),
    moneda: dom.recordCurrency.value,
    total: Number(dom.recordTotal.value || 0),
  };

  if (!payload.detalle) {
    setMessage(dom.formMessage, "El detalle es obligatorio.", true);
    return;
  }
  if (!payload.categoria) {
    setMessage(dom.formMessage, "La categoría es obligatoria.", true);
    return;
  }
  if (!payload.fechaHora) {
    setMessage(dom.formMessage, "La fecha/hora es obligatoria.", true);
    return;
  }

  try {
    setMessage(dom.formMessage, "Guardando registro...", false);
    await api("upsert", payload);
    closeRecordModal();
    await loadDashboard();
  } catch (error) {
    console.error(error);
    setMessage(dom.formMessage, error.message || "No fue posible guardar el registro.", true);
  }
}

async function deleteRecord(record) {
  const confirmed = confirm(`¿Eliminar el registro ${record.id}?`);
  if (!confirmed) return;

  try {
    await api("delete", { id: record.id });
    await loadDashboard();
  } catch (error) {
    console.error(error);
    alert(error.message || "No fue posible eliminar el registro.");
  }
}

async function api(action, payload = {}, withToken = true) {
  if (!CONFIG.APPS_SCRIPT_URL) {
    return localApi(action, payload, withToken);
  }

  const params = new URLSearchParams();
  params.append("action", action);

  if (withToken && state.token) {
    params.append("token", state.token);
  }

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, String(value));
  });

  let data;
  try {
    data = await jsonpRequest(CONFIG.APPS_SCRIPT_URL, params);
  } catch (networkError) {
    throw new Error(
      "No se pudo conectar con Google Apps Script. Revisá la URL del Web App, que el deployment esté publicado como 'Anyone' y que hayas actualizado Code.gs con soporte JSONP."
    );
  }

  if (!data || typeof data !== "object") {
    throw new Error("La respuesta del servidor no es válida.");
  }

  if (!data.ok) {
    throw new Error(data.message || "Error en Google Sheets / Apps Script.");
  }

  return data;
}

function jsonpRequest(baseUrl, params) {
  return new Promise((resolve, reject) => {
    const callbackName = `gdJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeoutMs = 15000;
    let settled = false;

    const cleanup = () => {
      delete window[callbackName];
      script.remove();
      clearTimeout(timeoutId);
    };

    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Tiempo de espera agotado al consultar Google Apps Script."));
    }, timeoutMs);

    window[callbackName] = (response) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(response);
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("No fue posible cargar la respuesta del servidor."));
    };

    params.set("callback", callbackName);
    params.set("_ts", String(Date.now()));
    script.src = `${baseUrl}?${params.toString()}`;
    script.async = true;
    document.body.appendChild(script);
  });
}

function localApi(action, payload = {}, withToken = true) {
  return new Promise((resolve, reject) => {
    try {
      if (withToken && state.token !== "demo-token") {
        throw new Error("Sesión no válida.");
      }

      const db = loadDemoDB() || { categories: [], records: [] };

      if (action === "login") {
        const valid = payload.username === DEMO_CREDENTIALS.username && payload.password === DEMO_CREDENTIALS.password;
        if (!valid) throw new Error("Usuario o contraseña incorrectos.");
        return resolve({ ok: true, token: "demo-token", user: payload.username });
      }

      if (action === "list") {
        const filtered = applyFilters(db.records, payload);
        return resolve({
          ok: true,
          records: sortRecords(filtered),
          categories: [...new Set(db.categories)].sort((a, b) => a.localeCompare(b)),
        });
      }

      if (action === "upsert") {
        if (!payload.categoria) throw new Error("La categoría es obligatoria.");

        const index = db.records.findIndex((item) => item.id === payload.id);
        const normalized = normalizeRecord(payload);

        if (index >= 0) db.records[index] = normalized;
        else db.records.push(normalized);

        if (!db.categories.includes(normalized.categoria)) {
          db.categories.push(normalized.categoria);
        }

        saveDemoDB(db);
        return resolve({ ok: true, record: normalized });
      }

      if (action === "delete") {
        db.records = db.records.filter((item) => item.id !== payload.id);
        saveDemoDB(db);
        return resolve({ ok: true });
      }

      return reject(new Error("Acción local no soportada."));
    } catch (error) {
      reject(error);
    }
  });
}

function applyFilters(records, filters) {
  let result = [...records];
  const now = new Date();

  if (filters.period === "7" || filters.period === "30") {
    const days = Number(filters.period);
    const limit = new Date(now.getTime() - days * 86400000);

    result = result.filter((item) => {
      const date = new Date(item.fechaHora);
      return !Number.isNaN(date.getTime()) && date >= limit;
    });
  }

  if (filters.period === "custom") {
    const from = filters.from ? new Date(`${filters.from}T00:00`) : null;
    const to = filters.to ? new Date(`${filters.to}T23:59`) : null;

    result = result.filter((item) => {
      const date = new Date(item.fechaHora);
      if (Number.isNaN(date.getTime())) return false;
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    });
  }

  if (filters.category) {
    result = result.filter((item) => item.categoria === filters.category);
  }

  if (filters.detail) {
    const needle = filters.detail.toLowerCase();
    result = result.filter((item) => String(item.detalle || "").toLowerCase().includes(needle));
  }

  if (filters.search) {
    const needle = filters.search.toLowerCase();
    result = result.filter((item) =>
      [item.id, item.detalle, item.categoria, item.moneda, item.movimiento].join(" ").toLowerCase().includes(needle)
    );
  }

  return sortRecords(result);
}

function emptySummary() {
  return {
    ARS: { ingresos: 0, egresos: 0, ahorro: 0, saldo: 0 },
    USD: { ingresos: 0, egresos: 0, ahorro: 0, saldo: 0 },
  };
}

function summarizeRecords(records) {
  const summary = emptySummary();

  for (const record of records) {
    const currency = String(record.moneda || "").toUpperCase();
    if (!summary[currency]) continue;

    const total = Number(record.total || 0);

    if (record.movimiento === "Ingreso") summary[currency].ingresos += total;
    if (record.movimiento === "Egreso") summary[currency].egresos += total;
    if (record.movimiento === "Ahorro") summary[currency].ahorro += total;
  }

  for (const currency of Object.keys(summary)) {
    summary[currency].saldo = summary[currency].ingresos - summary[currency].egresos - summary[currency].ahorro;
  }

  return summary;
}

function normalizeRecord(record) {
  const cantidad = Number(record.cantidad || 0);
  const precioUnitario = Number(record.precioUnitario || 0);

  return {
    id: record.id || generateId(),
    fechaHora: record.fechaHora || toDatetimeLocalValue(new Date()),
    detalle: String(record.detalle || "").trim(),
    categoria: String(record.categoria || "").trim(),
    movimiento: record.movimiento || "Egreso",
    cantidad,
    precioUnitario,
    moneda: record.moneda || "USD",
    total: Number(record.total || cantidad * precioUnitario),
  };
}

function sortRecords(records) {
  return [...records].sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));
}

function generateId() {
  return `GD-${Date.now()}`;
}

function toDatetimeLocalValue(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatCurrency(value, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch (error) {
    return `${currency} ${formatNumber(value)}`;
  }
}

function setMessage(element, message, isError) {
  if (!element) return;
  element.textContent = message;
  element.style.color = isError ? "var(--danger)" : "var(--text-soft)";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
