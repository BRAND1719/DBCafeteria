(function () {
  const limite = document.getElementById('limite');
  const top = document.getElementById('top');

  let bajos = [];
  let vendidos = [];

  // Paginacion de las dos tablas
  const pagBajos = crearPaginador(document.getElementById('tabla-bajos'), p =>
    `<tr><td>${esc(p.nombre)}</td><td>${esc(p.nombreCategoria)}</td><td class="num">${money(p.precio)}</td><td class="num">${badgeExistencia(p.existencia)}</td></tr>`);
  const pagTop = crearPaginador(document.getElementById('tabla-top'), (p, i) =>
    `<tr><td>${i + 1}</td><td>${esc(p.nombre)}</td><td>${esc(p.nombreCategoria)}</td><td class="num">${p.totalVendido}</td><td class="num">${money(p.totalIngresos)}</td></tr>`);

  // Exportar a Excel: un archivo con una hoja por reporte
  const barra = document.createElement('div');
  barra.className = 'barra-herramientas barra-derecha';
  document.querySelector('.contenido').prepend(barra);
  const btnExcel = botonExcel(barra, async () => {
    const dia = await pedidosDelDia();
    if (!dia) return;
    const { resumen, lineas } = dia;
    const usuario = usuarioActual() || {};
    const ahora = new Date();

    await exportarExcel('Reporte_del_dia', [
      {
        nombre: 'Resumen del día',
        titulo: 'Reporte del día - Cafetería',
        columnas: [{ titulo: 'Concepto', valor: f => f[0] }, { titulo: 'Valor', valor: f => f[1] }],
        filas: [
          ['Fecha del reporte', ahora.toLocaleDateString('es-MX')],
          ['Hora en que se generó', ahora.toLocaleTimeString('es-MX')],
          ['Generado por', `${usuario.nombre || ''} (${usuario.rol || ''})`],
          ['Pedidos del día', resumen.length],
          ['Pedidos confirmados', resumen.filter(p => p.estatus === 'Confirmado').length],
          ['Pedidos cancelados', resumen.filter(p => p.estatus === 'Cancelado').length],
          ['Productos vendidos (piezas)', lineas.filter(l => l.estatus === 'Confirmado').reduce((s, l) => s + l.cantidad, 0)],
          ['Ventas confirmadas', money(resumen.filter(p => p.estatus === 'Confirmado').reduce((s, p) => s + p.total, 0))]
        ],
        grafica: {
          titulo: 'Pedidos del día por estatus', categoria: 'Estatus', serie: 'Pedidos',
          datos: [['Confirmados', resumen.filter(p => p.estatus === 'Confirmado').length],
                  ['Cancelados', resumen.filter(p => p.estatus === 'Cancelado').length]]
        }
      },
      {
        nombre: 'Pedidos del día',
        columnas: [
          { titulo: 'Pedido', valor: p => p.idPedido },
          { titulo: 'Fecha', valor: p => p.fecha },
          { titulo: 'Hora', valor: p => p.hora },
          { titulo: 'Cliente', valor: p => p.nombreCliente },
          { titulo: 'Método de pago', valor: p => p.metodoPago },
          { titulo: 'Total', valor: p => p.total, formato: 'moneda' },
          { titulo: 'Estatus', valor: p => p.estatus }
        ],
        filas: resumen,
        grafica: {
          titulo: 'Ventas confirmadas por hora', categoria: 'Hora', serie: 'Ventas', formato: 'moneda',
          datos: agruparParaGrafica(resumen.filter(p => p.estatus === 'Confirmado'), p => String(p.hora).slice(0, 2) + ':00', p => p.total, { ordenar: false, limite: 24 })
            .sort((a, b) => a[0].localeCompare(b[0]))
        }
      },
      {
        nombre: 'Detalle de productos',
        columnas: [
          { titulo: 'Pedido', valor: l => l.idPedido },
          { titulo: 'Hora', valor: l => l.hora },
          { titulo: 'Cliente', valor: l => l.nombreCliente },
          { titulo: 'Producto', valor: l => l.nombreProducto },
          { titulo: 'Cantidad', valor: l => l.cantidad, formato: 'entero' },
          { titulo: 'Precio unitario', valor: l => l.precioUnitario, formato: 'moneda' },
          { titulo: 'Subtotal', valor: l => l.subtotal, formato: 'moneda' },
          { titulo: 'Observaciones', valor: l => l.observaciones },
          { titulo: 'Método de pago', valor: l => l.metodoPago },
          { titulo: 'Estatus del pedido', valor: l => l.estatus }
        ],
        filas: lineas,
        grafica: {
          titulo: 'Piezas vendidas hoy por producto', categoria: 'Producto', serie: 'Piezas',
          datos: agruparParaGrafica(lineas.filter(l => l.estatus === 'Confirmado'), l => l.nombreProducto, l => l.cantidad)
        }
      },
      {
        nombre: 'Existencia baja',
        columnas: [
          { titulo: 'Producto', valor: p => p.nombre },
          { titulo: 'Categoría', valor: p => p.nombreCategoria },
          { titulo: 'Precio', valor: p => p.precio, formato: 'moneda' },
          { titulo: 'Existencia', valor: p => p.existencia, formato: 'entero' }
        ],
        filas: bajos,
        grafica: { titulo: 'Existencia por producto', categoria: 'Producto', serie: 'Existencia',
          datos: bajos.slice(0, 15).map(p => [p.nombre, p.existencia]) }
      },
      {
        nombre: 'Más vendidos',
        columnas: [
          { titulo: 'Lugar', valor: p => vendidos.indexOf(p) + 1 },
          { titulo: 'Producto', valor: p => p.nombre },
          { titulo: 'Categoría', valor: p => p.nombreCategoria },
          { titulo: 'Piezas vendidas', valor: p => p.totalVendido, formato: 'entero' },
          { titulo: 'Ingresos', valor: p => p.totalIngresos, formato: 'moneda' }
        ],
        filas: vendidos,
        grafica: { titulo: 'Productos más vendidos', categoria: 'Producto', serie: 'Piezas vendidas',
          datos: vendidos.slice(0, 15).map(p => [p.nombre, p.totalVendido]) }
      }
    ]);
  });

  btnExcel.innerHTML = '📊 Exportar reporte del día a Excel';

  // Pedidos de hoy con el detalle de productos de cada uno
  async function pedidosDelDia() {
    const hoy = new Date();
    const fecha = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
    const r = await api('/Pedido' + qs({ fechaInicio: fecha, fechaFin: fecha }));
    if (!r.ok) { toast((r.data && r.data.respuesta) || 'No se pudieron obtener los pedidos del día', 'error'); return null; }

    const resumen = r.data;
    const completos = await Promise.all(resumen.map(p => api('/Pedido/' + p.idPedido)));
    const lineas = [];
    completos.forEach((c, i) => {
      const p = c.ok && c.data ? c.data : resumen[i];
      (p.detalle || []).forEach(d => lineas.push({ ...d, idPedido: p.idPedido, hora: p.hora, nombreCliente: p.nombreCliente, metodoPago: p.metodoPago, estatus: p.estatus }));
    });
    return { resumen, lineas };
  }

  async function cargarBajos() {
    const n = Math.max(0, parseInt(limite.value, 10) || 0);
    pagBajos.mensaje('<tr><td colspan="4" class="vacio">Cargando…</td></tr>');
    const r = await api('/Consulta/existencia-baja' + qs({ limite: n }));
    if (!r.ok) { bajos = []; pagBajos.mensaje('<tr><td colspan="4" class="vacio">No se pudo cargar</td></tr>'); toast((r.data && r.data.respuesta) || 'Error', 'error'); return; }
    bajos = r.data;
    pagBajos.mostrar(bajos, '<tr><td colspan="4" class="vacio">Ningún producto tiene esa existencia o menos</td></tr>');
  }

  async function cargarTop() {
    const n = Math.max(1, parseInt(top.value, 10) || 10);
    pagTop.mensaje('<tr><td colspan="5" class="vacio">Cargando…</td></tr>');
    const r = await api('/Consulta/mas-vendidos' + qs({ top: n }));
    if (!r.ok) { vendidos = []; pagTop.mensaje('<tr><td colspan="5" class="vacio">No se pudo cargar</td></tr>'); toast((r.data && r.data.respuesta) || 'Error', 'error'); return; }
    vendidos = r.data;
    pagTop.mostrar(vendidos, '<tr><td colspan="5" class="vacio">Aún no hay ventas registradas</td></tr>');
  }

  limite.addEventListener('change', cargarBajos);
  top.addEventListener('change', cargarTop);
  cargarBajos();
  cargarTop();
})();
