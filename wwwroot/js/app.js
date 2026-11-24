/* =====================================================================
   app.js - utilidades compartidas: API, sesion, menu, avisos
   ===================================================================== */

// Vacio = la API y las paginas viven en el mismo servidor (Visual Studio).
// Si abres los HTML desde otro servidor, pon aqui la URL de la API, por ejemplo 'http://localhost:5299'
const API_BASE = '';
const CLAVE_SESION = 'cafeteria_usuario';

const fmtMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const money = n => fmtMoneda.format(Number(n) || 0);

// Evita inyectar HTML con datos que vienen de la base de datos
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function qs(obj) {
  const partes = Object.entries(obj)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return partes.length ? '?' + partes.join('&') : '';
}

// yyyy-mm-dd (input date) -> dd/mm/yyyy (lo que espera la API)
function fechaApi(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ---------- Llamadas a la API ---------- */
// Siempre regresa { ok, status, data }; data es el JSON (aunque sea un error 400/401/500)
async function api(ruta, { method = 'GET', body } = {}) {
  try {
    const res = await fetch(API_BASE + '/api' + ruta, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    let data = null;
    try { data = await res.json(); } catch { /* respuesta sin cuerpo */ }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false, status: 0,
      data: { numeroError: -1, respuesta: 'No se pudo conectar con el servidor. Verifica que la API este en ejecucion.' }
    };
  }
}

/* ---------- Sesion ---------- */
function usuarioActual() {
  try { return JSON.parse(sessionStorage.getItem(CLAVE_SESION)); } catch { return null; }
}
function guardarSesion(usuario) { sessionStorage.setItem(CLAVE_SESION, JSON.stringify(usuario)); }
function cerrarSesion() {
  sessionStorage.removeItem(CLAVE_SESION);
  location.href = 'index.html';
}

/* ---------- Avisos y confirmaciones ---------- */
function toast(mensaje, tipo = 'ok') {
  let caja = document.getElementById('toasts');
  if (!caja) {
    caja = document.createElement('div');
    caja.id = 'toasts';
    document.body.appendChild(caja);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (tipo === 'error' ? ' error' : '');
  el.textContent = mensaje;
  caja.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

function confirmar(mensaje, textoBoton = 'Confirmar', peligro = true) {
  return new Promise(resolver => {
    const dlg = document.createElement('dialog');
    dlg.className = 'dialogo dialogo-chico';
    dlg.innerHTML = `
      <div class="dialogo-cuerpo"><p style="margin:0">${esc(mensaje)}</p></div>
      <div class="dialogo-pie">
        <button type="button" class="btn btn-secundario" data-no>Cancelar</button>
        <button type="button" class="btn ${peligro ? 'btn-peligro' : 'btn-primario'}" data-si>${esc(textoBoton)}</button>
      </div>`;
    document.body.appendChild(dlg);
    dlg.querySelector('[data-si]').onclick = () => { resolver(true); dlg.close(); };
    dlg.querySelector('[data-no]').onclick = () => dlg.close();
    dlg.addEventListener('close', () => { resolver(false); dlg.remove(); });
    dlg.showModal();
  });
}

/* ---------- Insignias reutilizables ---------- */
const badgeEstatus = activo =>
  `<span class="badge ${activo ? 'badge-ok' : 'badge-gris'}">${activo ? 'Activo' : 'Inactivo'}</span>`;

const badgePedido = estatus =>
  `<span class="badge ${estatus === 'Cancelado' ? 'badge-error' : 'badge-ok'}">${esc(estatus)}</span>`;

const badgeExistencia = n =>
  n <= 0 ? '<span class="badge badge-error">Agotado</span>'
    : n <= 5 ? `<span class="badge badge-aviso">${n} (bajo)</span>`
      : `<span class="badge badge-gris">${n}</span>`;

/* ---------- Menu lateral y barra superior ---------- */
const NAV = [
  { id: 'dashboard', texto: 'Dashboard', icono: '📊', href: 'dashboard.html' },
  { id: 'nuevo-pedido', texto: 'Nuevo pedido', icono: '🧾', href: 'nuevo-pedido.html' },
  { id: 'pedidos', texto: 'Pedidos', icono: '📦', href: 'pedidos.html' },
  { id: 'clientes', texto: 'Clientes', icono: '👥', href: 'clientes.html' },
  { id: 'productos', texto: 'Productos', icono: '☕', href: 'productos.html' },
  { id: 'categorias', texto: 'Categorías', icono: '🏷️', href: 'categorias.html' },
  { id: 'reportes', texto: 'Reportes', icono: '📈', href: 'reportes.html' },
  { id: 'usuarios', texto: 'Usuarios', icono: '🔑', href: 'usuarios.html', soloAdmin: true }
];

function armarShell() {
  const pagina = document.body.dataset.pagina;
  if (!pagina || pagina === 'login') return;

  const usuario = usuarioActual();
  if (!usuario) { location.replace('index.html'); return; }

  const actual = NAV.find(n => n.id === pagina);
  if (actual && actual.soloAdmin && usuario.rol !== 'Administrador') {
    location.replace('dashboard.html');
    return;
  }

  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="marca">
      <span class="logo">☕</span>
      <div><strong>Cafetería</strong><small>Portal de pedidos</small></div>
    </div>
    <nav>
      ${NAV.filter(n => !n.soloAdmin || usuario.rol === 'Administrador').map(n =>
        `<a href="${n.href}" class="${n.id === pagina ? 'activo' : ''}"><span>${n.icono}</span>${n.texto}</a>`
      ).join('')}
    </nav>
    <div class="usuario-caja">
      <strong>${esc(usuario.nombre)}</strong>
      <small>${esc(usuario.rol)}</small>
      <button class="btn btn-fantasma btn-bloque" id="btn-salir">Cerrar sesión</button>
    </div>`;

  document.getElementById('topbar').innerHTML = `
    <button class="btn-menu" id="btn-menu" aria-label="Abrir menú">☰</button>
    <h1>${esc(document.body.dataset.titulo || '')}</h1>
    <span class="topbar-usuario">${esc(usuario.nombre)} · ${esc(usuario.rol)}</span>`;

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);

  const alternar = abrir => {
    sidebar.classList.toggle('abierto', abrir);
    overlay.classList.toggle('visible', abrir);
  };
  document.getElementById('btn-menu').onclick = () => alternar(true);
  overlay.onclick = () => alternar(false);
  document.getElementById('btn-salir').onclick = cerrarSesion;
}

armarShell();


/* ---------- PWA: registro e instalación ---------- */
(function configurarPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js', { scope: './', updateViaCache: 'none' })
        .catch(error => console.warn('No se pudo registrar la PWA:', error));
    });
  }

  let boton = document.getElementById('btn-instalar-app');
  if (!boton && document.body.dataset.pagina !== 'login') {
    const topbar = document.getElementById('topbar');
    if (topbar) {
      boton = document.createElement('button');
      boton.type = 'button';
      boton.id = 'btn-instalar-app';
      boton.className = 'btn btn-secundario btn-chico pwa-instalar';
      boton.textContent = '📲 Instalar app';
      boton.hidden = true;
      topbar.insertBefore(boton, topbar.querySelector('.topbar-usuario'));
    }
  }
  if (!boton) return;

  let instalacionPendiente = null;
  window.addEventListener('beforeinstallprompt', evento => {
    evento.preventDefault();
    instalacionPendiente = evento;
    boton.hidden = false;
  });

  boton.addEventListener('click', async () => {
    if (!instalacionPendiente) return;
    const aviso = instalacionPendiente;
    instalacionPendiente = null;
    boton.disabled = true;
    try {
      await aviso.prompt();
      const resultado = await aviso.userChoice;
      boton.hidden = resultado.outcome === 'accepted';
    } catch (error) {
      console.warn('Instalación no completada:', error);
    } finally {
      boton.disabled = false;
      // El evento no puede utilizarse dos veces; hay que esperar uno nuevo.
      boton.hidden = true;
    }
  });

  window.addEventListener('appinstalled', () => {
    instalacionPendiente = null;
    boton.hidden = true;
  });
})();
