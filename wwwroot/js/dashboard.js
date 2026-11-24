// MODULO REPORTES - Pantalla de dashboard

(async function () {
  const stats = document.getElementById('stats');
  const bajos = document.querySelector('#tabla-bajos tbody');
  const top = document.querySelector('#tabla-top tbody');

  const [resumen, bajo, vendidos] = await Promise.all([
    api('/Consulta/dashboard'),
    api('/Consulta/existencia-baja?limite=5'),
    api('/Consulta/mas-vendidos?top=5')
  ]);

  if (resumen.ok && resumen.data) {
    const d = resumen.data;
    const tarjeta = (etiqueta, valor, clase = '') =>
      `<div class="tarjeta stat ${clase}"><div class="etiqueta">${etiqueta}</div><div class="valor">${valor}</div></div>`;
    stats.innerHTML =
      tarjeta('Ventas de hoy', money(d.ventasHoy), 'bueno') +
      tarjeta('Pedidos de hoy', d.pedidosHoy) +
      tarjeta('Clientes activos', d.clientesActivos) +
      tarjeta('Productos activos', d.productosActivos) +
      tarjeta('Existencia baja', d.productosExistenciaBaja, d.productosExistenciaBaja > 0 ? 'alerta' : '') +
      tarjeta('Pedidos cancelados', d.pedidosCancelados, d.pedidosCancelados > 0 ? 'peligro' : '');
  } else {
    stats.innerHTML = '<div class="aviso aviso-error">No se pudieron cargar los indicadores.</div>';
    toast((resumen.data && resumen.data.respuesta) || 'Error al cargar el dashboard', 'error');
  }

  bajos.innerHTML = (bajo.ok && bajo.data.length)
    ? bajo.data.map(p => `<tr><td>${esc(p.nombre)}<small>${esc(p.nombreCategoria)}</small></td><td class="num">${badgeExistencia(p.existencia)}</td></tr>`).join('')
    : '<tr><td colspan="2" class="vacio">Sin productos con existencia baja 🎉</td></tr>';

  top.innerHTML = (vendidos.ok && vendidos.data.length)
    ? vendidos.data.map((p, i) => `<tr><td>${i + 1}. ${esc(p.nombre)}<small>${esc(p.nombreCategoria)}</small></td><td class="num">${p.totalVendido} pzas<small>${money(p.totalIngresos)}</small></td></tr>`).join('')
    : '<tr><td colspan="2" class="vacio">Aún no hay ventas registradas</td></tr>';
})();
