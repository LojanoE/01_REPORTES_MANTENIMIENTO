# Plan: Rediseño Dashboard Tecnico - Sistema GDR

## Resumen
Rediseño completo del sistema de reportes de mantenimiento con estilo **dashboard tecnico industrial**: bordes angulares, colores de estado, tipografia tecnica, datos prominentes y layout de panel de control.

## Archivos a modificar

### 1. `dashboard.css` (NUEVO - Estilo base compartido)
Crear archivo CSS con variables de diseño, componentes reutilizables y estilos base.

### 2. `index.html` + `landing.css` (Portal Principal)
- Login overlay con estilo panel tecnico
- Tarjetas de aplicaciones como paneles de dashboard
- Header compacto con logos
- User bar unificada

### 3. `MANTENIMIENTO/index.html` + `MANTENIMIENTO/styles.css`
- Layout de panel con KPIs superiores
- Formularios compactos estilo tecnico
- Tablas optimizadas con hover states
- Tabs estilo dashboard

### 4. `POZOS/index.html` + `POZOS/style.css`
- Checklist de inspeccion estilo formulario tecnico
- Secciones con bordes de estado
- Tablas de bombas y niveles
- Grafica integrada

### 5. `BODEGAS/index.html` + `BODEGAS/style.css`
- Tabla de inventario con indicadores de stock
- Formularios de ingreso/egreso compactos
- Tabs de navegacion estilo dashboard

---

## Codigo Completo por Archivo

### ARCHIVO 1: `dashboard.css` (NUEVO)

```css
/* ============================================================
   DASHBOARD TECNICO - Sistema de Gestion de Depositos de Relaves
   ============================================================ */

@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
    --bg-deep: #0a0e1a;
    --bg-primary: #0f1628;
    --bg-surface: #151d32;
    --bg-elevated: #1a2340;
    --bg-input: #1e2a4a;
    
    --border-subtle: rgba(100, 140, 200, 0.12);
    --border-default: rgba(100, 140, 200, 0.25);
    --border-strong: rgba(100, 140, 200, 0.4);
    
    --text-primary: #e8edf5;
    --text-secondary: #8b9cc7;
    --text-muted: #5a6a8a;
    
    --accent-cyan: #00d4ff;
    --accent-cyan-dim: #0099cc;
    --accent-amber: #ff9f1c;
    --accent-amber-dim: #cc7a00;
    --accent-emerald: #00e676;
    --accent-emerald-dim: #00b359;
    --accent-red: #ff3d71;
    --accent-red-dim: #cc2a55;
    --accent-purple: #a855f7;
    
    --status-ok: #00e676;
    --status-warning: #ff9f1c;
    --status-danger: #ff3d71;
    --status-info: #00d4ff;
    
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
    --shadow-glow-cyan: 0 0 20px rgba(0, 212, 255, 0.15);
    --shadow-glow-amber: 0 0 20px rgba(255, 159, 28, 0.15);
    
    --font-display: 'Rajdhani', 'Segoe UI', sans-serif;
    --font-body: 'Inter', 'Segoe UI', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;
    --space-2xl: 3rem;
    
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    
    --transition-fast: 150ms ease;
    --transition-base: 250ms ease;
    --transition-slow: 400ms ease;
    
    --header-height: 56px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
    font-size: 16px;
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
}

body {
    font-family: var(--font-body);
    background: var(--bg-deep);
    color: var(--text-primary);
    line-height: 1.5;
    min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    font-weight: 600;
    line-height: 1.2;
}

h1 { font-size: 1.75rem; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.25rem; }
h4 { font-size: 1.1rem; }

.text-mono { font-family: var(--font-mono); font-size: 0.875rem; }
.text-muted { color: var(--text-muted); }
.text-secondary { color: var(--text-secondary); }
.text-cyan { color: var(--accent-cyan); }
.text-amber { color: var(--accent-amber); }
.text-emerald { color: var(--accent-emerald); }
.text-red { color: var(--accent-red); }

/* === USER BAR === */
.user-bar {
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-default);
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-lg);
    position: sticky;
    top: 0;
    z-index: 100;
}

.user-bar__info {
    display: flex;
    align-items: center;
    gap: var(--space-md);
}

.user-bar__avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    display: flex;
    align-items: center;
    justify-content: center;
}

.user-bar__name { font-weight: 600; font-size: 0.9rem; }

.user-bar__role {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-sm);
}

.user-bar__role--admin {
    background: rgba(255, 61, 113, 0.15);
    color: var(--accent-red);
    border: 1px solid rgba(255, 61, 113, 0.3);
}

.user-bar__role--user {
    background: rgba(0, 212, 255, 0.15);
    color: var(--accent-cyan);
    border: 1px solid rgba(0, 212, 255, 0.3);
}

.user-bar__role--viewer {
    background: rgba(139, 156, 199, 0.15);
    color: var(--text-secondary);
    border: 1px solid rgba(139, 156, 199, 0.3);
}

.user-bar__actions { display: flex; align-items: center; gap: var(--space-sm); }

/* === BOTONES === */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    padding: 0.6rem 1.2rem;
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-weight: 600;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
}

.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn--primary {
    background: var(--accent-cyan);
    color: var(--bg-deep);
    border-color: var(--accent-cyan);
}

.btn--primary:hover:not(:disabled) {
    background: var(--accent-cyan-dim);
    box-shadow: var(--shadow-glow-cyan);
}

.btn--amber {
    background: var(--accent-amber);
    color: var(--bg-deep);
    border-color: var(--accent-amber);
}

.btn--amber:hover:not(:disabled) {
    background: var(--accent-amber-dim);
    box-shadow: var(--shadow-glow-amber);
}

.btn--emerald {
    background: var(--accent-emerald);
    color: var(--bg-deep);
    border-color: var(--accent-emerald);
}

.btn--emerald:hover:not(:disabled) { background: var(--accent-emerald-dim); }

.btn--danger {
    background: transparent;
    color: var(--accent-red);
    border-color: var(--accent-red);
}

.btn--danger:hover:not(:disabled) {
    background: var(--accent-red);
    color: var(--bg-deep);
}

.btn--ghost {
    background: transparent;
    color: var(--text-secondary);
    border-color: var(--border-default);
}

.btn--ghost:hover:not(:disabled) {
    background: var(--bg-elevated);
    color: var(--text-primary);
    border-color: var(--border-strong);
}

.btn--sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; }
.btn--lg { padding: 0.8rem 1.6rem; font-size: 0.95rem; }

/* === FORMULARIOS === */
.form-group { display: flex; flex-direction: column; gap: var(--space-xs); }

.form-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
}

.form-input, .form-select, .form-textarea {
    background: var(--bg-input);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 0.6rem 0.8rem;
    font-family: var(--font-body);
    font-size: 0.9rem;
    color: var(--text-primary);
    transition: all var(--transition-fast);
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
    outline: none;
    border-color: var(--accent-cyan);
    box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.form-input::placeholder, .form-textarea::placeholder { color: var(--text-muted); }
.form-textarea { resize: vertical; min-height: 80px; }

/* === TABLAS === */
.table-container {
    overflow-x: auto;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
}

.table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }

.table thead {
    background: var(--bg-elevated);
    position: sticky;
    top: 0;
    z-index: 10;
}

.table th {
    padding: var(--space-md) var(--space-lg);
    text-align: left;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    border-bottom: 2px solid var(--border-default);
    white-space: nowrap;
}

.table td {
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--border-subtle);
    vertical-align: middle;
}

.table tbody tr { transition: background var(--transition-fast); }
.table tbody tr:hover { background: var(--bg-elevated); }
.table tbody tr:last-child td { border-bottom: none; }

/* === BADGES === */
.badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 0.2rem 0.6rem;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
}

.badge--ok {
    background: rgba(0, 230, 118, 0.12);
    color: var(--status-ok);
    border-color: rgba(0, 230, 118, 0.25);
}

.badge--warning {
    background: rgba(255, 159, 28, 0.12);
    color: var(--status-warning);
    border-color: rgba(255, 159, 28, 0.25);
}

.badge--danger {
    background: rgba(255, 61, 113, 0.12);
    color: var(--status-danger);
    border-color: rgba(255, 61, 113, 0.25);
}

.badge--info {
    background: rgba(0, 212, 255, 0.12);
    color: var(--status-info);
    border-color: rgba(0, 212, 255, 0.25);
}

/* === KPI CARDS === */
.kpi-grid {
    display: grid;
    gap: var(--space-lg);
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.kpi-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    transition: all var(--transition-base);
}

.kpi-card:hover {
    border-color: var(--border-strong);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.kpi-card__label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
}

.kpi-card__value {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
}

.kpi-card__delta { font-size: 0.8rem; font-weight: 600; }
.kpi-card__delta--up { color: var(--status-ok); }
.kpi-card__delta--down { color: var(--status-danger); }

/* === PANELS === */
.panel {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.panel--cyan { border-top: 3px solid var(--accent-cyan); }
.panel--amber { border-top: 3px solid var(--accent-amber); }
.panel--emerald { border-top: 3px solid var(--accent-emerald); }
.panel--red { border-top: 3px solid var(--accent-red); }

.panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md) var(--space-lg);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
}

.panel__title {
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.panel__body { padding: var(--space-lg); }
.panel__body--compact { padding: var(--space-md); }

/* === TABS === */
.tabs {
    display: flex;
    gap: var(--space-xs);
    border-bottom: 2px solid var(--border-default);
    margin-bottom: var(--space-lg);
}

.tab {
    padding: var(--space-md) var(--space-lg);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    transition: all var(--transition-fast);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.tab:hover { color: var(--text-primary); }
.tab--active { color: var(--accent-cyan); border-bottom-color: var(--accent-cyan); }

/* === LOGIN === */
.login-overlay {
    position: fixed;
    inset: 0;
    background: var(--bg-deep);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.login-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-top: 3px solid var(--accent-cyan);
    border-radius: var(--radius-lg);
    padding: var(--space-2xl);
    width: 100%;
    max-width: 400px;
    box-shadow: var(--shadow-lg);
}

.login-card__icon { text-align: center; font-size: 2.5rem; margin-bottom: var(--space-md); }
.login-card__title { text-align: center; font-size: 1.5rem; font-weight: 700; margin-bottom: var(--space-xs); }
.login-card__subtitle { text-align: center; color: var(--text-secondary); font-size: 0.9rem; margin-bottom: var(--space-xl); }

/* === ANIMACIONES === */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
}

.animate-fade-in { animation: fadeIn 0.4s ease forwards; }
.animate-slide-in { animation: slideIn 0.4s ease forwards; }

.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }

/* === RESPONSIVE === */
@media (max-width: 768px) {
    :root { --space-lg: 1rem; --space-xl: 1.5rem; --space-2xl: 2rem; }
    h1 { font-size: 1.4rem; }
    h2 { font-size: 1.2rem; }
    h3 { font-size: 1.1rem; }
    
    .kpi-grid { grid-template-columns: 1fr; }
    .user-bar { padding: 0 var(--space-md); }
    .user-bar__name { display: none; }
    .panel__body { padding: var(--space-md); }
    .table th, .table td { padding: var(--space-sm) var(--space-md); font-size: 0.8rem; }
    .kpi-card__value { font-size: 1.5rem; }
    .tabs { overflow-x: auto; }
    .tab { padding: var(--space-sm) var(--space-md); font-size: 0.75rem; white-space: nowrap; }
}

@media (max-width: 480px) {
    html { font-size: 14px; }
    .login-card { padding: var(--space-xl); margin: var(--space-md); }
    .btn { padding: 0.5rem 1rem; font-size: 0.8rem; }
}
```

---

### ARCHIVO 2: `landing.css` (REEMPLAZAR COMPLETO)

```css
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

:root {
    --bg-deep: #0a0e1a;
    --bg-surface: #151d32;
    --bg-elevated: #1a2340;
    --bg-input: #1e2a4a;
    --border-default: rgba(100, 140, 200, 0.25);
    --border-strong: rgba(100, 140, 200, 0.4);
    --text-primary: #e8edf5;
    --text-secondary: #8b9cc7;
    --text-muted: #5a6a8a;
    --accent-cyan: #00d4ff;
    --accent-amber: #ff9f1c;
    --accent-emerald: #00e676;
    --accent-red: #ff3d71;
    --font-display: 'Rajdhani', sans-serif;
    --font-body: 'Inter', system-ui, sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
    background: var(--bg-deep);
    color: var(--text-primary);
    font-family: var(--font-body);
    min-height: 100vh;
}

/* === LOGIN OVERLAY === */
#loginOverlay {
    position: fixed;
    inset: 0;
    background: var(--bg-deep);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.login-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-top: 3px solid var(--accent-cyan);
    border-radius: 12px;
    padding: 3rem 2rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.login-icon {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

.login-title {
    text-align: center;
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
}

.login-subtitle {
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
}

.login-input {
    background: var(--bg-input) !important;
    border: 1px solid var(--border-default) !important;
    border-radius: 6px !important;
    color: var(--text-primary) !important;
    padding: 0.75rem 1rem !important;
    margin-bottom: 0.75rem !important;
    font-size: 1rem;
    width: 100%;
}

.login-input::placeholder { color: var(--text-muted) !important; }

.login-input:focus {
    border-color: var(--accent-cyan) !important;
    box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1) !important;
    outline: none;
}

.login-btn {
    background: var(--accent-cyan) !important;
    color: var(--bg-deep) !important;
    font-weight: 700 !important;
    border: none !important;
    border-radius: 6px !important;
    padding: 0.75rem !important;
    font-size: 1rem !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
}

.login-btn:hover {
    background: #0099cc !important;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
}

.login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.login-error {
    color: var(--accent-red);
    margin-top: 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
    display: none;
    text-align: center;
}

/* === USER BAR === */
#userBar {
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-default);
    height: 56px;
}

.auth-user-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1.5rem;
    height: 100%;
    max-width: 1400px;
    margin: 0 auto;
}

.auth-user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.auth-user-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
}

.auth-user-name {
    color: var(--text-primary);
    font-weight: 600;
    font-size: 0.9rem;
}

.auth-user-role {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    color: white;
}

.auth-user-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.auth-logout-btn {
    background: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    border-radius: 6px;
    padding: 0.4rem 1rem;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.auth-logout-btn:hover {
    background: rgba(255, 61, 113, 0.15);
    border-color: var(--accent-red);
    color: var(--accent-red);
}

.auth-admin-btn {
    background: transparent;
    border: 1px solid var(--accent-purple);
    color: var(--accent-purple);
    border-radius: 6px;
    padding: 0.4rem 1rem;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.auth-admin-btn:hover {
    background: var(--accent-purple);
    color: white;
}

/* === HEADER === */
header {
    padding: 2rem 1rem 1rem;
    text-align: center;
}

.logo-header {
    gap: 1.5rem;
    margin-bottom: 1rem;
}

.header-logo {
    height: 70px;
    width: auto;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    transition: transform 0.3s ease;
}

.header-logo:hover { transform: scale(1.05); }

.bilingual-title { text-align: center; }

.bilingual-title .line1 {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.3rem;
    letter-spacing: 0.05em;
    color: var(--text-primary);
}

.bilingual-title .line2 {
    font-size: 1rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
}

.bilingual-title .sep {
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
    margin: 0.75rem auto;
    width: 60%;
    max-width: 300px;
}

.bilingual-title .line3 .es {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text-primary);
}

.bilingual-title .line3 .cn {
    font-size: 0.9rem;
    margin-top: 0.25rem;
    color: var(--text-secondary);
}

/* === APP CARDS (Dashboard Style) === */
.app-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 10px;
    padding: 2rem 1.5rem;
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.app-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--card-accent);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.app-card:hover::before { opacity: 1; }

.mantenimiento-card { --card-accent: var(--accent-cyan); }
.pozos-card { --card-accent: var(--accent-amber); }
.bodegas-card { --card-accent: var(--accent-emerald); }

.app-card:hover {
    border-color: var(--border-strong);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.card-icon { margin-bottom: 1rem; }

.icon-emoji {
    font-size: 3rem;
    display: block;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    transition: transform 0.3s ease;
}

.app-card:hover .icon-emoji { transform: scale(1.1); }

.card-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.4rem;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.card-subtitle {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
}

.card-divider {
    height: 2px;
    width: 50px;
    background: var(--card-accent);
    margin: 1rem auto;
    border-radius: 2px;
}

.card-description {
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    flex-grow: 1;
}

.card-footer { margin-top: auto; }

.access-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.5rem;
    background: var(--card-accent);
    color: var(--bg-deep);
    font-weight: 700;
    border-radius: 6px;
    transition: all 0.3s ease;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-size: 0.85rem;
}

.app-card:hover .access-btn {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.access-btn svg { transition: transform 0.3s ease; }
.app-card:hover .access-btn svg { transform: translateX(4px); }

.card-link { display: block; height: 100%; }
.card-link:hover, .card-link:focus, .card-link:active {
    text-decoration: none;
    outline: none;
}

/* === FOOTER === */
footer {
    padding: 1.5rem 1rem;
    text-align: center;
    border-top: 1px solid var(--border-default);
}

.footer-text {
    color: var(--text-muted);
    font-size: 0.8rem;
    margin: 0;
}

/* === ADMIN PANEL === */
.admin-panel {
    margin: 2rem auto;
    max-width: 900px;
    padding: 0 1rem;
}

.admin-panel-inner {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 10px;
    padding: 1.5rem;
}

.admin-panel-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.2rem;
    color: var(--text-primary);
}

.admin-close-btn {
    background: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    border-radius: 6px;
    font-size: 0.8rem;
    padding: 0.3rem 0.8rem;
    cursor: pointer;
}

.admin-close-btn:hover {
    background: rgba(255, 61, 113, 0.15);
    color: var(--accent-red);
    border-color: var(--accent-red);
}

.admin-role-info {
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.8;
}

.admin-form-card {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: 8px;
    overflow: hidden;
}

.admin-form-header {
    background: var(--accent-cyan);
    color: var(--bg-deep);
    font-weight: 700;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.admin-form-body { padding: 1rem; }

.admin-label {
    color: var(--text-secondary);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
}

.admin-input {
    background: var(--bg-input) !important;
    border: 1px solid var(--border-default) !important;
    border-radius: 6px !important;
    color: var(--text-primary) !important;
    font-size: 0.9rem;
}

.admin-input::placeholder { color: var(--text-muted) !important; }

.admin-input:focus {
    border-color: var(--accent-cyan) !important;
    box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1) !important;
}

.admin-save-btn {
    background: var(--accent-emerald) !important;
    color: var(--bg-deep) !important;
    font-weight: 600;
    border: none !important;
    border-radius: 6px !important;
    padding: 0.5rem 1rem !important;
    text-transform: uppercase;
}

.admin-save-btn:hover { background: var(--accent-emerald-dim, #00b359) !important; }

.admin-cancel-btn {
    background: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    border-radius: 6px;
    font-size: 0.8rem;
}

.admin-table { --bs-table-bg: transparent; --bs-table-color: var(--text-primary); --bs-table-border-color: var(--border-default); }

.admin-table thead th {
    background: var(--bg-elevated);
    color: var(--text-primary);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-color: var(--border-default);
}

.admin-table tbody td {
    color: var(--text-primary);
    border-color: var(--border-default);
}

.admin-edit-btn {
    background: transparent;
    border: 1px solid var(--accent-cyan);
    color: var(--accent-cyan);
    border-radius: 6px;
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
}

.admin-edit-btn:hover {
    background: var(--accent-cyan);
    color: var(--bg-deep);
}

.admin-delete-btn {
    background: transparent;
    border: 1px solid var(--accent-red);
    color: var(--accent-red);
    border-radius: 6px;
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
}

.admin-delete-btn:hover {
    background: var(--accent-red);
    color: var(--bg-deep);
}

/* === ANIMACIONES === */
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.app-card {
    animation: fadeInUp 0.5s ease forwards;
    opacity: 0;
}

.col-12:nth-child(1) .app-card { animation-delay: 0.1s; }
.col-12:nth-child(2) .app-card { animation-delay: 0.2s; }
.col-12:nth-child(3) .app-card { animation-delay: 0.3s; }

/* === RESPONSIVE === */
@media (max-width: 768px) {
    .header-logo { height: 55px; }
    .bilingual-title .line1 { font-size: 1.1rem; }
    .bilingual-title .line2 { font-size: 0.9rem; }
    .bilingual-title .line3 .es { font-size: 0.85rem; }
    .bilingual-title .line3 .cn { font-size: 0.8rem; }
    .app-card { padding: 1.5rem 1rem; }
    .card-title { font-size: 1.2rem; }
    .icon-emoji { font-size: 2.5rem; }
}

@media (max-width: 480px) {
    .header-logo { height: 45px; }
    .logo-header { gap: 1rem; }
    .bilingual-title .line1 { font-size: 0.95rem; }
    .card-title { font-size: 1.1rem; }
    .access-btn { padding: 0.5rem 1rem; font-size: 0.8rem; }
    .auth-user-bar { padding: 0 1rem; }
}
```

---

### ARCHIVO 3: `MANTENIMIENTO/styles.css` (REEMPLAZAR COMPLETO)

```css
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
    --bg-deep: #0a0e1a;
    --bg-surface: #151d32;
    --bg-elevated: #1a2340;
    --bg-input: #1e2a4a;
    --border-default: rgba(100, 140, 200, 0.25);
    --border-strong: rgba(100, 140, 200, 0.4);
    --text-primary: #e8edf5;
    --text-secondary: #8b9cc7;
    --text-muted: #5a6a8a;
    --accent-cyan: #00d4ff;
    --accent-amber: #ff9f1c;
    --accent-emerald: #00e676;
    --accent-red: #ff3d71;
    --font-display: 'Rajdhani', sans-serif;
    --font-body: 'Inter', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
    background: var(--bg-deep);
    color: var(--text-primary);
    font-family: var(--font-body);
    min-height: 100vh;
}

/* === USER BAR === */
#userBar {
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-default);
    height: 56px;
}

.auth-user-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1.5rem;
    height: 100%;
}

.auth-user-info { display: flex; align-items: center; gap: 1rem; }

.auth-user-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    display: flex;
    align-items: center;
    justify-content: center;
}

.auth-user-name { color: var(--text-primary); font-weight: 600; font-size: 0.9rem; }

.auth-user-role {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    color: white;
}

.auth-user-actions { display: flex; align-items: center; gap: 0.5rem; }

.auth-logout-btn {
    background: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    border-radius: 6px;
    padding: 0.4rem 1rem;
    font-size: 0.8rem;
    cursor: pointer;
    font-weight: 600;
    text-transform: uppercase;
}

.auth-logout-btn:hover {
    background: rgba(255, 61, 113, 0.15);
    border-color: var(--accent-red);
    color: var(--accent-red);
}

.auth-admin-btn {
    background: transparent;
    border: 1px solid #a855f7;
    color: #a855f7;
    border-radius: 6px;
    padding: 0.4rem 1rem;
    font-size: 0.8rem;
    cursor: pointer;
    font-weight: 600;
    text-transform: uppercase;
}

.auth-admin-btn:hover { background: #a855f7; color: white; }

/* === HEADER === */
.kpi-card {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
}

.logo-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.rdv-logo {
    height: 60px;
    width: auto;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.bilingual-title { text-align: center; }

.bilingual-title .line1 {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.2rem;
    letter-spacing: 0.05em;
}

.bilingual-title .line2 {
    font-size: 1rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
}

.bilingual-title .sep {
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
    margin: 0.5rem auto;
    width: 50%;
    max-width: 200px;
}

.bilingual-title .line3 .es {
    font-weight: 600;
    font-size: 0.9rem;
}

.bilingual-title .line3 .cn {
    font-size: 0.85rem;
    color: var(--text-secondary);
}

/* === TABS === */
.nav-tabs {
    border-bottom: 2px solid var(--border-default);
    margin-bottom: 1.5rem;
}

.nav-tabs .nav-link {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.75rem 1.25rem;
    margin-bottom: -2px;
    transition: all 0.2s ease;
}

.nav-tabs .nav-link:hover {
    color: var(--text-primary);
}

.nav-tabs .nav-link.active {
    background: transparent;
    border-bottom-color: var(--accent-cyan);
    color: var(--accent-cyan);
}

/* === CARD / PANEL === */
.card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 10px;
}

.tab-content > .card {
    padding: 1.5rem;
}

/* === FORMULARIOS === */
.form-label {
    color: var(--text-secondary) !important;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.form-control, .form-select {
    background: var(--bg-input) !important;
    border: 1px solid var(--border-default) !important;
    border-radius: 6px !important;
    color: var(--text-primary) !important;
    padding: 0.6rem 0.8rem !important;
    font-size: 0.9rem;
}

.form-control::placeholder { color: var(--text-muted) !important; }

.form-control:focus, .form-select:focus {
    border-color: var(--accent-cyan) !important;
    box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1) !important;
}

textarea.form-control {
    font-family: var(--font-mono);
    font-size: 0.85rem;
}

/* === BOTONES === */
.btn {
    border-radius: 6px;
    padding: 0.6rem 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-size: 0.85rem;
    border: 1px solid transparent;
}

.btn-primary {
    background: var(--accent-cyan);
    color: var(--bg-deep);
    border-color: var(--accent-cyan);
}

.btn-primary:hover {
    background: #0099cc;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
}

.btn-success {
    background: var(--accent-emerald);
    color: var(--bg-deep);
    border-color: var(--accent-emerald);
}

.btn-success:hover { background: #00b359; }

.btn-danger {
    background: transparent;
    color: var(--accent-red);
    border-color: var(--accent-red);
}

.btn-danger:hover {
    background: var(--accent-red);
    color: var(--bg-deep);
}

/* === TABLAS === */
.table-container {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid var(--border-default);
    border-radius: 10px;
}

.table {
    --bs-table-color: var(--text-primary);
    --bs-table-bg: transparent;
    font-size: 0.85rem;
}

.table thead {
    background: var(--bg-elevated);
    position: sticky;
    top: 0;
    z-index: 10;
}

.table th {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    border-bottom: 2px solid var(--border-default);
    padding: 0.75rem 1rem;
}

.table td {
    color: var(--text-primary);
    border-bottom: 1px solid rgba(100, 140, 200, 0.12);
    padding: 0.75rem 1rem;
}

.table tbody tr:hover {
    background: var(--bg-elevated);
}

/* === CHART === */
.chart-container {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 10px;
    padding: 1.5rem;
}

/* === TOGGLE LANG BUTTON === */
#btn-toggle-lang {
    background: var(--bg-surface) !important;
    border: 1px solid var(--border-default) !important;
    bottom: 20px;
    right: 20px;
}

#btn-toggle-lang:hover {
    border-color: var(--accent-cyan);
}

/* === MODAL === */
.mensaje-modal .modal-content {
    background: var(--bg-surface) !important;
    border: 1px solid var(--border-default) !important;
    border-radius: 10px !important;
}

.mensaje-modal .modal-header {
    border-bottom: 1px solid var(--border-default) !important;
}

.mensaje-modal .modal-footer {
    border-top: 1px solid var(--border-default) !important;
}

.mensaje-modal .btn-close { filter: invert(1) !important; }

/* === RESPONSIVE === */
@media (max-width: 768px) {
    .rdv-logo { height: 45px; }
    .bilingual-title .line1 { font-size: 1rem; }
    .bilingual-title .line2 { font-size: 0.85rem; }
    .nav-tabs .nav-link { padding: 0.5rem 0.75rem; font-size: 0.75rem; }
    .table th, .table td { padding: 0.5rem 0.75rem; font-size: 0.8rem; }
}

@media (max-width: 520px) {
    .rdv-logo { height: 35px; }
    .logo-bar { flex-direction: column; gap: 0.5rem; }
    .kpi-card { padding: 1rem 0.5rem; }
}

/* === PRINT === */
@media print {
    body { background: #fff !important; color: #000 !important; }
    .no-print, #userBar, .nav-tabs, #btn-toggle-lang { display: none !important; }
    .card, .table-container, .chart-container {
        background: #fff !important;
        border-color: #000 !important;
        box-shadow: none !important;
    }
    * { color: #000 !important; }
}
```

---

### ARCHIVO 4: `POZOS/style.css` (REEMPLAZAR COMPLETO)

```css
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
    --bg-deep: #0a0e1a;
    --bg-surface: #151d32;
    --bg-elevated: #1a2340;
    --bg-input: #1e2a4a;
    --border-default: rgba(100, 140, 200, 0.25);
    --border-strong: rgba(100, 140, 200, 0.4);
    --text-primary: #e8edf5;
    --text-secondary: #8b9cc7;
    --text-muted: #5a6a8a;
    --accent-cyan: #00d4ff;
    --accent-amber: #ff9f1c;
    --accent-emerald: #00e676;
    --accent-red: #ff3d71;
    --font-display: 'Rajdhani', sans-serif;
    --font-body: 'Inter', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
    background: var(--bg-deep);
    color: var(--text-primary);
    font-family: var(--font-body);
    min-height: 100vh;
}

/* === USER BAR === */
#userBar {
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-default);
    height: 56px;
}

.auth-user-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1.5rem;
    height: 100%;
    max-width: 1200px;
    margin: 0 auto;
}

.auth-user-info { display: flex; align-items: center; gap: 1rem; }

.auth-user-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    display: flex;
    align-items: center;
    justify-content: center;
}

.auth-user-name { color: var(--text-primary); font-weight: 600; font-size: 0.9rem; }

.auth-user-role {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    color: white;
}

.auth-user-actions { display: flex; align-items: center; gap: 0.5rem; }

.auth-logout-btn {
    background: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    border-radius: 6px;
    padding: 0.4rem 1rem;
    font-size: 0.8rem;
    cursor: pointer;
    font-weight: 600;
    text-transform: uppercase;
}

.auth-logout-btn:hover {
    background: rgba(255, 61, 113, 0.15);
    border-color: var(--accent-red);
    color: var(--accent-red);
}

/* === MAIN CONTAINER === */
.main-container {
    max-width: 1200px;
    margin: 1.5rem auto;
    padding: 0 1rem;
}

/* === TABS === */
.nav-tabs {
    border-bottom: 2px solid var(--border-default);
    margin-bottom: 1.5rem;
}

.nav-tabs .nav-link {
    color: var(--text-secondary);
    border: none;
    border-bottom: 2px solid transparent;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.75rem 1rem;
    margin-bottom: -2px;
    transition: all 0.2s ease;
}

.nav-tabs .nav-link:hover { color: var(--text-primary); }

.nav-tabs .nav-link.active {
    background: transparent;
    border-bottom-color: var(--accent-amber);
    color: var(--accent-amber);
}

/* === HEADINGS === */
h1 {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 700;
    text-align: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--border-default);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.zh-text {
    display: block;
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 400;
    margin-bottom: 0.25rem;
    text-transform: none;
    letter-spacing: normal;
}

.es-text {
    display: block;
    font-weight: 700;
    color: var(--text-primary);
    text-transform: none;
    letter-spacing: normal;
}

/* === FORM SECTIONS === */
.form-section {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-left: 3px solid var(--accent-amber);
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
}

.form-label {
    color: var(--text-secondary) !important;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.4rem;
}

.form-control, .form-control-sm {
    background: var(--bg-input) !important;
    border: 1px solid var(--border-default) !important;
    border-radius: 6px !important;
    color: var(--text-primary) !important;
    font-size: 0.9rem;
}

.form-control:focus, .form-control-sm:focus {
    border-color: var(--accent-amber) !important;
    box-shadow: 0 0 0 3px rgba(255, 159, 28, 0.1) !important;
}

/* === TABLES === */
.table-responsive { margin-top: 1rem; }

.table {
    font-size: 0.85rem;
    border: 1px solid var(--border-default);
    border-radius: 8px;
    overflow: hidden;
}

.table thead th {
    background: var(--bg-elevated);
    color: var(--text-primary);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    padding: 0.75rem;
    border-bottom: 2px solid var(--border-default);
}

.table-dark {
    background: var(--bg-elevated) !important;
}

.table tbody tr {
    border-bottom: 1px solid var(--border-default);
    transition: background 0.2s ease;
}

.table tbody tr:hover { background: var(--bg-elevated); }

.table td {
    padding: 0.75rem;
    vertical-align: middle;
}

.table-bordered { border: 1px solid var(--border-default) !important; }

/* === CARDS === */
.card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 10px;
}

.card-header {
    background: var(--bg-elevated) !important;
    border-bottom: 1px solid var(--border-default);
    font-weight: 600;
    padding: 0.75rem 1rem;
}

/* === BUTTONS === */
.btn {
    border-radius: 6px;
    padding: 0.6rem 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-size: 0.85rem;
    border: 1px solid transparent;
}

.btn-primary {
    background: var(--accent-amber);
    color: var(--bg-deep);
    border-color: var(--accent-amber);
}

.btn-primary:hover {
    background: #cc7a00;
    box-shadow: 0 0 20px rgba(255, 159, 28, 0.2);
}

.btn-success {
    background: var(--accent-emerald);
    color: var(--bg-deep);
    border-color: var(--accent-emerald);
}

.btn-success:hover { background: #00b359; }

.btn-secondary {
    background: transparent;
    color: var(--text-secondary);
    border-color: var(--border-default);
}

.btn-secondary:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
}

/* === PROGRESS BAR === */
.progress {
    background: var(--bg-elevated);
    border-radius: 6px;
    height: 8px;
}

.progress-bar {
    background: var(--accent-amber);
    border-radius: 6px;
}

/* === CHART CONTAINER === */
#waterLevelChart {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 10px;
    padding: 1rem;
}

/* === FOOTER === */
.text-center.pb-3 {
    padding: 1.5rem 0;
    border-top: 1px solid var(--border-default);
    margin-top: 2rem;
}

.text-center.pb-3 small { color: var(--text-muted); }

.text-center.pb-3 a {
    color: var(--accent-amber) !important;
    font-weight: 600;
}

.text-center.pb-3 a:hover { color: #cc7a00 !important; }

/* === RESPONSIVE === */
@media (max-width: 768px) {
    h1 { font-size: 1.2rem; }
    .nav-tabs .nav-link { padding: 0.5rem 0.75rem; font-size: 0.7rem; }
    .table th, .table td { padding: 0.5rem; font-size: 0.8rem; }
    .form-section { padding: 1rem; }
}

@media (max-width: 480px) {
    .auth-user-bar { padding: 0 1rem; }
    .auth-user-name { display: none; }
    h1 { font-size: 1rem; }
    .zh-text { font-size: 0.75rem; }
    .es-text { font-size: 0.9rem; }
}
```

---

### ARCHIVO 5: `BODEGAS/style.css` (REEMPLAZAR COMPLETO)

```css
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
    --bg-deep: #0a0e1a;
    --bg-surface: #151d32;
    --bg-elevated: #1a2340;
    --bg-input: #1e2a4a;
    --border-default: rgba(100, 140, 200, 0.25);
    --border-strong: rgba(100, 140, 200, 0.4);
    --text-primary: #e8edf5;
    --text-secondary: #8b9cc7;
    --text-muted: #5a6a8a;
    --accent-cyan: #00d4ff;
    --accent-amber: #ff9f1c;
    --accent-emerald: #00e676;
    --accent-red: #ff3d71;
    --font-display: 'Rajdhani', sans-serif;
    --font-body: 'Inter', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
}

* { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

html, body {
    background: var(--bg-deep);
    color: var(--text-primary);
    font-family: var(--font-body);
    min-height: 100vh;
}

/* === USER BAR === */
#userBar {
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-default);
    height: 56px;
}

.auth-user-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1.5rem;
    height: 100%;
}

.auth-user-info { display: flex; align-items: center; gap: 1rem; }

.auth-user-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    display: flex;
    align-items: center;
    justify-content: center;
}

.auth-user-name { color: var(--text-primary); font-weight: 600; font-size: 0.9rem; }

.auth-user-role {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    color: white;
}

.auth-user-actions { display: flex; align-items: center; gap: 0.5rem; }

.auth-logout-btn {
    background: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    border-radius: 6px;
    padding: 0.4rem 1rem;
    font-size: 0.8rem;
    cursor: pointer;
    font-weight: 600;
    text-transform: uppercase;
}

.auth-logout-btn:hover {
    background: rgba(255, 61, 113, 0.15);
    border-color: var(--accent-red);
    color: var(--accent-red);
}

/* === HEADER === */
.main-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
}

.subtitle {
    color: var(--text-secondary);
    font-size: 0.9rem;
    letter-spacing: 0.1em;
}

/* === TABS === */
.nav-tabs {
    border-bottom: 2px solid var(--border-default);
    margin-bottom: 1.5rem;
}

.nav-tabs .nav-link {
    color: var(--text-secondary);
    border: none;
    border-bottom: 2px solid transparent;
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.75rem 1.25rem;
    margin-bottom: -2px;
    transition: all 0.2s ease;
}

.nav-tabs .nav-link:hover { color: var(--text-primary); }

.nav-tabs .nav-link.active {
    background: transparent;
    border-bottom-color: var(--accent-emerald);
    color: var(--accent-emerald);
}

/* === CARDS === */
.card {
    background: var(--bg-surface) !important;
    border: 1px solid var(--border-default) !important;
    border-radius: 10px !important;
}

.card-body { padding: 1.25rem; }

.card-header {
    background: var(--bg-elevated) !important;
    border-bottom: 1px solid var(--border-default);
    font-weight: 600;
    padding: 0.75rem 1rem;
}

/* === FORMS === */
.form-label {
    color: var(--text-secondary) !important;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.form-control, .form-select {
    background: var(--bg-input) !important;
    border: 1px solid var(--border-default) !important;
    border-radius: 6px !important;
    color: var(--text-primary) !important;
    padding: 0.6rem 0.8rem !important;
    font-size: 0.9rem;
}

.form-control:focus, .form-select:focus {
    border-color: var(--accent-emerald) !important;
    box-shadow: 0 0 0 3px rgba(0, 230, 118, 0.1) !important;
}

/* === TABLES === */
.table {
    --bs-table-color: var(--text-primary);
    --bs-table-bg: transparent;
    font-size: 0.85rem;
}

.table thead th {
    background: var(--bg-elevated);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    border-bottom: 2px solid var(--border-default);
    padding: 0.75rem 1rem;
}

.table tbody tr {
    border-bottom: 1px solid var(--border-default);
    transition: background 0.2s ease;
}

.table tbody tr:hover { background: var(--bg-elevated); }

.table td {
    padding: 0.75rem 1rem;
    vertical-align: middle;
}

/* === BADGES === */
.badge-stock {
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.badge-ok {
    background: rgba(0, 230, 118, 0.12);
    color: var(--accent-emerald);
    border: 1px solid rgba(0, 230, 118, 0.25);
}

.badge-low {
    background: rgba(255, 159, 28, 0.12);
    color: var(--accent-amber);
    border: 1px solid rgba(255, 159, 28, 0.25);
}

.badge-out {
    background: rgba(255, 61, 113, 0.12);
    color: var(--accent-red);
    border: 1px solid rgba(255, 61, 113, 0.25);
}

/* === BUTTONS === */
.btn {
    border-radius: 6px;
    padding: 0.6rem 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-size: 0.85rem;
    border: 1px solid transparent;
}

.btn-primary {
    background: var(--accent-emerald);
    color: var(--bg-deep);
    border-color: var(--accent-emerald);
}

.btn-primary:hover { background: #00b359; }

.btn-success {
    background: var(--accent-emerald);
    color: var(--bg-deep);
    border-color: var(--accent-emerald);
}

.btn-success:hover { background: #00b359; }

.btn-danger {
    background: transparent;
    color: var(--accent-red);
    border-color: var(--accent-red);
}

.btn-danger:hover {
    background: var(--accent-red);
    color: var(--bg-deep);
}

.btn-outline-success {
    background: transparent;
    color: var(--accent-emerald);
    border-color: var(--accent-emerald);
}

.btn-outline-success:hover {
    background: var(--accent-emerald);
    color: var(--bg-deep);
}

.btn-outline-light {
    background: transparent;
    color: var(--text-secondary);
    border-color: var(--border-default);
}

.btn-outline-light:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
}

.btn-outline-warning {
    background: transparent;
    color: var(--accent-amber);
    border-color: var(--accent-amber);
}

.btn-outline-warning:hover {
    background: var(--accent-amber);
    color: var(--bg-deep);
}

/* === PAGINATION === */
#inventoryPaginationInfo {
    font-size: 0.8rem;
    color: var(--text-secondary);
}

#inventoryPrevBtn:disabled, #inventoryNextBtn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

#loadMoreBtn {
    border-radius: 20px;
    padding: 0.5rem 1.5rem;
}

#transCount {
    font-size: 0.85rem;
    color: var(--text-secondary);
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
    .hide-mobile { display: none !important; }
    .main-title { font-size: 1.2rem; }
    .subtitle { font-size: 0.75rem; }
    .nav-tabs .nav-link { padding: 0.5rem 0.75rem; font-size: 0.75rem; }
    .card-body { padding: 0.75rem; }
    .table thead th { font-size: 0.65rem; padding: 0.4rem 0.5rem; }
    .table td { padding: 0.4rem 0.5rem; font-size: 0.8rem; }
    .badge { font-size: 0.6rem; padding: 0.15rem 0.4rem; }
    .btn { padding: 0.4rem 0.75rem; font-size: 0.75rem; }
    .form-control, .form-select { padding: 0.4rem 0.6rem; font-size: 0.8rem; }
}

@media (max-width: 480px) {
    .auth-user-bar { padding: 0 1rem; }
    .auth-user-name { display: none; }
}
```

---

## Instrucciones de Implementacion

1. **Crear archivo nuevo**: `dashboard.css` en la raiz del proyecto
2. **Reemplazar** `landing.css` con el contenido proporcionado
3. **Reemplazar** `MANTENIMIENTO/styles.css` con el contenido proporcionado
4. **Reemplazar** `POZOS/style.css` con el contenido proporcionado
5. **Reemplazar** `BODEGAS/style.css` con el contenido proporcionado

### Cambios en HTML (opcionales pero recomendados)

Para aprovechar al máximo el nuevo diseño, se recomienda actualizar las clases HTML:

- En `index.html`: Cambiar `login-card` a usar las nuevas clases
- En modulos: Reemplazar Bootstrap tabs con clases `.tabs` y `.tab`
- Tablas: Envolver en `.table-container` para scroll y bordes
- KPIs: Usar estructura `.kpi-card` con `__label`, `__value`, `__delta`

### Caracteristicas del nuevo diseño

- **Tipografia tecnica**: Rajdhani para titulos, Inter para cuerpo, JetBrains Mono para codigo
- **Colores de estado**: Cyan (info), Amber (warning), Emerald (ok), Red (danger)
- **Bordes angulares**: Radius minimos (4-8px) para estilo industrial
- **Hover states**: Tablas con highlight, tarjetas con elevacion
- **Badges de estado**: Indicadores visuales claros para stock, roles, etc.
- **Animaciones sutiles**: Fade-in escalonado en tarjetas, transiciones fluidas
- **Responsive**: Layout adaptativo con grid colapsable en movil
