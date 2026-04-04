# Gastos Diarios · HTML + CSS + JS + Google Sheets

Este proyecto incluye:

- `index.html`
- `styles.css`
- `script.js`
- `Code.gs` (backend de Google Apps Script)
- `gastos_diarios_google_sheets_template.xlsx` (plantilla para importar en Google Sheets)

## 1) Qué hace

- Login con:
  - **usuario:** `admin`
  - **password:** `admin342$$=`
- Dashboard responsive estilo mockup
- Toggle oscuro / claro con iconos sol / luna
- KPIs:
  - Ingresos
  - Egresos / Gastos
  - Saldo
  - Ahorro
- Alta, edición, vista y eliminación de registros
- Filtros por:
  - 7 días
  - 30 días
  - desde / hasta
  - categoría
  - detalle
  - búsqueda general
- Nuevas categorías guardadas en Google Sheets

## 2) Estructura de Google Sheets

### Hoja: `Registros`
Columnas:

1. `ID`
2. `FechaHora`
3. `Detalle`
4. `Categoria`
5. `Cantidad`
6. `PrecioUnitario`
7. `Moneda`
8. `Total`
9. `Movimiento`
10. `CreatedAt`
11. `UpdatedAt`

> **Nota importante:** agregué el campo `Movimiento` (`Ingreso`, `Egreso`, `Ahorro`) porque sin esa clasificación no se pueden calcular correctamente los 4 bloques del dashboard.

### Hoja: `Categorias`
- `Categoria`

### Hoja: `Config`
- variables simples de apoyo

## 3) Cómo conectar el frontend con Google Sheets

### Paso A — Crear la Sheet
1. Crear una Google Sheet nueva.
2. Importar el archivo `gastos_diarios_google_sheets_template.xlsx`
   o crear las hojas manualmente.

### Paso B — Apps Script
1. Abrir la Google Sheet.
2. Ir a **Extensiones > Apps Script**.
3. Reemplazar el contenido del editor por `Code.gs`.
4. Guardar.

### Paso C — Ejecutar setup
1. En Apps Script, ejecutar `setupSheets_()` una vez.
2. Aceptar permisos.

### Paso D — Publicar
1. Ir a **Deploy > New deployment**
2. Elegir **Web app**
3. Ejecutar como: **Me**
4. Acceso: **Anyone**
5. Deploy
6. Copiar la URL del Web App

### Paso E — Pegar la URL
En `script.js`, buscar:

```js
APPS_SCRIPT_URL: ""
```

y pegar la URL, por ejemplo:

```js
APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycb.../exec"
```

## 4) Cómo probar rápido sin Google Sheets

Si dejás vacía la variable:

```js
APPS_SCRIPT_URL: ""
```

la app funciona en **modo demo local** usando `localStorage`, para que puedas verla al instante antes de conectarla a Google Sheets.

## 5) Publicación del frontend

Podés subir el frontend en:

- Hostinger
- Netlify
- GitHub Pages
- cualquier hosting estático

Archivos a publicar:

- `index.html`
- `styles.css`
- `script.js`
- carpeta `assets`

## 6) Seguridad

El login solicitado quedó implementado **tal como lo pediste**, pero al ser un frontend + Apps Script simple:

- no es un sistema de autenticación empresarial
- conviene mover usuario/clave a una configuración más segura si lo vas a usar en producción real
- idealmente deberías sumar usuarios reales o autenticación de Google

## 7) Fórmula del saldo

El saldo quedó calculado como:

```text
Saldo = Ingresos - Egresos - Ahorro
```

Si querés, después te lo adapto a otra lógica contable.
