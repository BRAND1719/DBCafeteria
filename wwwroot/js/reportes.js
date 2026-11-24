// MODULO REPORTES - Pantalla de reportes (existencia baja y mas vendidos)

(function () {
  const limite = document.getElementById('limite');
  const top = document.getElementById('top');
  const tbBajos = document.querySelector('#tabla-bajos tbody');
  const tbTop = document.querySelector('#tabla-top tbody');

  async function cargarBajos() {
    const n = Math.max(0, parseInt(limite.value, 10) || 0);
    tbBajos.innerHTML = '<tr><td colspan="4" class="vacio">Cargando…</td></tr>';
    const r = await api('/Consulta/existencia-baja' + qs({ limite: n }));
    if (!r.ok) { tbBajos.innerHTML = '<tr><td colspan="4" class="vacio">No se pudo cargar</td></tr>'; toast((r.data && r.data.respuesta) || 'Error', 'error'); return; }
    tbBajos.innerHTML = r.data.length
      ? r.data.map(p => `<tr><td>${esc(p.nombre)}</td><td>${esc(p.nombreCategoria)}</td><td class="num">${money(p.precio)}</td><td class="num">${badgeExistencia(p.existencia)}</td></tr>`).join('')
      : '<tr><td colspan="4" class="vacio">Ningún producto tiene esa existencia o menos</td></tr>';
  }

  async function cargarTop() {
    const n = Math.max(1, parseInt(top.value, 10) || 10);
    tbTop.innerHTML = '<tr><td colspan="5" class="vacio">Cargando…</td></tr>';
    const r = await api('/Consulta/mas-vendidos' + qs({ top: n }));
    if (!r.ok) { tbTop.innerHTML = '<tr><td colspan="5" class="vacio">No se pudo cargar</td></tr>'; toast((r.data && r.data.respuesta) || 'Error', 'error'); return; }
    tbTop.innerHTML = r.data.length
      ? r.data.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.nombre)}</td><td>${esc(p.nombreCategoria)}</td><td class="num">${p.totalVendido}</td><td class="num">${money(p.totalIngresos)}</td></tr>`).join('')
      : '<tr><td colspan="5" class="vacio">Aún no hay ventas registradas</td></tr>';
  }

  limite.addEventListener('change', cargarBajos);
  top.addEventListener('change', cargarTop);
  cargarBajos();
  cargarTop();
})();
