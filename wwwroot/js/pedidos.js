(async function () {
  const tbody = document.querySelector('#tabla tbody');
  const selCliente = document.getElementById('f-cliente');
  const selEstatus = document.getElementById('f-estatus');
  const fDesde = document.getElementById('f-desde');
  const fHasta = document.getElementById('f-hasta');
  const dlg = document.getElementById('dlg-detalle');
  const cuerpo = document.getElementById('detalle-cuerpo');
  const resumenEl = document.getElementById('resumen');

  let pedidos = [];

  async function cargarClientes() {
    const r = await api('/Cliente');
    if (r.ok) {
      selCliente.insertAdjacentHTML('beforeend',
        r.data.map(c => `<option value="${c.idCliente}">${esc(c.nombre)}</option>`).join(''));
    }
  }

  async function cargar() {
    if (fDesde.value && fHasta.value && fDesde.value > fHasta.value) {
      toast('La fecha inicial no puede ser mayor que la final', 'error');
      return;
    }
    tbody.innerHTML = '<tr><td colspan="7" class="vacio">Cargando…</td></tr>';
    const r = await api('/Pedido' + qs({
      idCliente: selCliente.value,
      estatus: selEstatus.value,
      fechaInicio: fechaApi(fDesde.value),
      fechaFin: fechaApi(fHasta.value)
    }));
    if (!r.ok) {
      tbody.innerHTML = '<tr><td colspan="7" class="vacio">No se pudieron cargar los pedidos</td></tr>';
      toast((r.data && r.data.respuesta) || 'Error al consultar pedidos', 'error');
      return;
    }
    pedidos = r.data;
    pintar();
  }

  function pintar() {
    const confirmados = pedidos.filter(p => p.estatus === 'Confirmado');
    const suma = confirmados.reduce((s, p) => s + p.total, 0);
    resumenEl.textContent = `${pedidos.length} pedido(s) · ${confirmados.length} confirmado(s) · ventas confirmadas: ${money(suma)}`;

    if (!pedidos.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="vacio">No hay pedidos con esos filtros</td></tr>';
      return;
    }
    tbody.innerHTML = pedidos.map(p => `
      <tr>
        <td>#${p.idPedido}</td>
        <td>${esc(p.fecha)}<small>${esc(p.hora)}</small></td>
        <td>${esc(p.nombreCliente)}</td>
        <td>${esc(p.metodoPago)}</td>
        <td class="num">${money(p.total)}</td>
        <td>${badgePedido(p.estatus)}</td>
        <td class="col-acciones">
          <button class="btn btn-secundario btn-chico" data-ver="${p.idPedido}">Ver</button>
          ${p.estatus === 'Confirmado' ? `<button class="btn btn-peligro btn-chico" data-cancelar="${p.idPedido}">Cancelar</button>` : ''}
        </td>
      </tr>`).join('');
  }

  async function verDetalle(id) {
    cuerpo.innerHTML = '<div class="vacio">Cargando…</div>';
    dlg.showModal();
    const r = await api('/Pedido/' + id);
    if (!r.ok) { cuerpo.innerHTML = `<div class="aviso aviso-error">${esc((r.data && r.data.respuesta) || 'No se pudo cargar el pedido')}</div>`; return; }
    const p = r.data;
    document.getElementById('detalle-titulo').textContent = `Pedido #${p.idPedido}`;
    cuerpo.innerHTML = `
      <div class="detalle-datos">
        <div><span>Cliente</span><strong>${esc(p.nombreCliente)}</strong></div>
        <div><span>Fecha y hora</span><strong>${esc(p.fecha)} ${esc(p.hora)}</strong></div>
        <div><span>Método de pago</span><strong>${esc(p.metodoPago)}</strong></div>
        <div><span>Estatus</span>${badgePedido(p.estatus)}${p.fechaCancelacion ? `<small>Cancelado el ${esc(p.fechaCancelacion)}</small>` : ''}</div>
      </div>
      <div class="tabla-wrap"><table>
        <thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Subtotal</th></tr></thead>
        <tbody>${p.detalle.map(d => `
          <tr>
            <td>${esc(d.nombreProducto)}${d.observaciones ? `<small>Obs: ${esc(d.observaciones)}</small>` : ''}</td>
            <td class="num">${d.cantidad}</td>
            <td class="num">${money(d.precioUnitario)}</td>
            <td class="num">${money(d.subtotal)}</td>
          </tr>`).join('')}
        </tbody>
        <tfoot><tr><td colspan="3" class="num"><strong>Total</strong></td><td class="num"><strong>${money(p.total)}</strong></td></tr></tfoot>
      </table></div>`;
  }

  async function cancelar(id) {
    if (!await confirmar(`¿Cancelar el pedido #${id}? Las existencias de sus productos se devolverán al inventario.`, 'Cancelar pedido')) return;
    const r = await api(`/Pedido/${id}/cancelar`, { method: 'PUT' });
    if (r.ok && r.data && r.data.numeroError === 0) { toast(r.data.respuesta); cargar(); }
    else toast((r.data && r.data.respuesta) || 'No se pudo cancelar el pedido', 'error');
  }

  tbody.addEventListener('click', e => {
    const ver = e.target.closest('[data-ver]');
    const can = e.target.closest('[data-cancelar]');
    if (ver) verDetalle(+ver.dataset.ver);
    if (can) cancelar(+can.dataset.cancelar);
  });
  document.getElementById('btn-filtrar').onclick = cargar;
  document.getElementById('btn-limpiar').onclick = () => {
    selCliente.value = ''; selEstatus.value = ''; fDesde.value = ''; fHasta.value = '';
    cargar();
  };
  dlg.querySelectorAll('[data-cerrar]').forEach(b => b.onclick = () => dlg.close());

  await cargarClientes();
  cargar();
})();
