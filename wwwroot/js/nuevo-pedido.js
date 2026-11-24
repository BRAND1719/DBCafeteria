// MODULO PEDIDOS - Pantalla de nuevo pedido
// Selecciona cliente, forma de pago y productos para registrar el pedido

(async function () {
  const selCliente = document.getElementById('cliente');
  const selPago = document.getElementById('pago');
  const grid = document.getElementById('grid-productos');
  const buscar = document.getElementById('buscar');
  const chips = document.getElementById('chips');
  const listaCarrito = document.getElementById('lista-carrito');
  const totalEl = document.getElementById('total');
  const btnConfirmar = document.getElementById('btn-confirmar');
  const btnVaciar = document.getElementById('btn-vaciar');
  const aviso = document.getElementById('aviso');

  let productos = [];
  let categoriaSel = '';
  const carrito = new Map(); // idProducto -> { producto, cantidad, obs }

  const mostrarAviso = (texto, tipo = 'error') => {
    aviso.textContent = texto;
    aviso.className = 'aviso aviso-' + tipo;
    aviso.hidden = false;
  };

  /* ---------- clientes ---------- */
  async function cargarClientes() {
    const r = await api('/Cliente');
    if (!r.ok) { toast('No se pudieron cargar los clientes', 'error'); return; }
    selCliente.innerHTML = '<option value="">Selecciona un cliente…</option>' +
      r.data.filter(c => c.estatus).map(c => `<option value="${c.idCliente}">${esc(c.nombre)}</option>`).join('');
  }

  /* ---------- productos ---------- */
  async function cargarProductos() {
    const r = await api('/Producto');
    if (!r.ok) { toast('No se pudieron cargar los productos', 'error'); return; }
    productos = r.data.filter(p => p.estatus);

    // sincroniza el carrito con la existencia mas reciente
    for (const [id, linea] of carrito) {
      const p = productos.find(x => x.idProducto === id);
      if (!p || p.existencia < 1) carrito.delete(id);
      else { linea.producto = p; if (linea.cantidad > p.existencia) linea.cantidad = p.existencia; }
    }
    pintarChips();
    pintarProductos();
    pintarCarrito();
  }

  function pintarChips() {
    const cats = [...new Set(productos.map(p => p.nombreCategoria))].sort();
    chips.innerHTML = ['', ...cats].map(c =>
      `<button type="button" class="chip ${c === categoriaSel ? 'activo' : ''}" data-cat="${esc(c)}">${c ? esc(c) : 'Todos'}</button>`
    ).join('');
  }

  function pintarProductos() {
    const texto = buscar.value.trim().toLowerCase();
    const lista = productos.filter(p =>
      (!categoriaSel || p.nombreCategoria === categoriaSel) &&
      (!texto || p.nombre.toLowerCase().includes(texto) || p.descripcion.toLowerCase().includes(texto)));

    if (!lista.length) { grid.innerHTML = '<div class="vacio" style="grid-column:1/-1">No hay productos para mostrar</div>'; return; }

    grid.innerHTML = lista.map(p => `
      <div class="tarjeta producto-card ${p.existencia < 1 ? 'agotado' : ''}">
        <span class="cat">${esc(p.nombreCategoria)}</span>
        <h3>${esc(p.nombre)}</h3>
        <div class="desc">${esc(p.descripcion)}</div>
        <div class="precio">${money(p.precio)}</div>
        <div class="stock">${p.existencia < 1 ? 'Agotado' : 'Existencia: ' + p.existencia}</div>
        <button type="button" class="btn btn-primario btn-chico" data-add="${p.idProducto}" ${p.existencia < 1 ? 'disabled' : ''}>Agregar</button>
      </div>`).join('');
  }

  /* ---------- carrito ---------- */
  function agregar(id) {
    const p = productos.find(x => x.idProducto === id);
    if (!p) return;
    const linea = carrito.get(id);
    const nueva = (linea ? linea.cantidad : 0) + 1;
    if (nueva > p.existencia) { toast(`Solo hay ${p.existencia} en existencia de ${p.nombre}`, 'error'); return; }
    carrito.set(id, { producto: p, cantidad: nueva, obs: linea ? linea.obs : '' });
    pintarCarrito();
  }

  function pintarCarrito() {
    aviso.hidden = true;
    if (!carrito.size) {
      listaCarrito.innerHTML = '<div class="vacio">Aún no agregas productos</div>';
    } else {
      listaCarrito.innerHTML = [...carrito.values()].map(l => `
        <div class="linea" data-id="${l.producto.idProducto}">
          <div class="linea-top"><span>${esc(l.producto.nombre)}</span><span>${money(l.producto.precio)}</span></div>
          <div class="linea-ctrl">
            <button type="button" class="btn btn-secundario" data-menos>−</button>
            <input type="number" min="1" max="${l.producto.existencia}" value="${l.cantidad}" data-cant aria-label="Cantidad">
            <button type="button" class="btn btn-secundario" data-mas>+</button>
            <span class="sub">${money(l.cantidad * l.producto.precio)}</span>
            <button type="button" class="btn btn-secundario btn-chico" data-quitar title="Quitar">✕</button>
          </div>
          <input type="text" class="obs" maxlength="200" placeholder="Observaciones (opcional)" value="${esc(l.obs)}" data-obs>
        </div>`).join('');
    }
    const total = [...carrito.values()].reduce((s, l) => s + l.cantidad * l.producto.precio, 0);
    totalEl.textContent = money(total);
  }

  function cambiarCantidad(id, cantidad) {
    const linea = carrito.get(id);
    if (!linea) return;
    if (cantidad < 1) { carrito.delete(id); }
    else if (cantidad > linea.producto.existencia) {
      toast(`Solo hay ${linea.producto.existencia} en existencia de ${linea.producto.nombre}`, 'error');
      linea.cantidad = linea.producto.existencia;
    } else { linea.cantidad = cantidad; }
    pintarCarrito();
  }

  /* ---------- eventos ---------- */
  chips.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    categoriaSel = b.dataset.cat;
    pintarChips();
    pintarProductos();
  });
  buscar.addEventListener('input', pintarProductos);

  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (b) agregar(+b.dataset.add);
  });

  listaCarrito.addEventListener('click', e => {
    const fila = e.target.closest('.linea');
    if (!fila) return;
    const id = +fila.dataset.id;
    const linea = carrito.get(id);
    if (e.target.closest('[data-mas]')) cambiarCantidad(id, linea.cantidad + 1);
    if (e.target.closest('[data-menos]')) cambiarCantidad(id, linea.cantidad - 1);
    if (e.target.closest('[data-quitar]')) { carrito.delete(id); pintarCarrito(); }
  });
  listaCarrito.addEventListener('change', e => {
    const fila = e.target.closest('.linea');
    if (fila && e.target.matches('[data-cant]')) cambiarCantidad(+fila.dataset.id, parseInt(e.target.value, 10) || 1);
  });
  listaCarrito.addEventListener('input', e => {
    const fila = e.target.closest('.linea');
    if (fila && e.target.matches('[data-obs]')) carrito.get(+fila.dataset.id).obs = e.target.value;
  });

  btnVaciar.onclick = () => { carrito.clear(); pintarCarrito(); };

  btnConfirmar.onclick = async () => {
    aviso.hidden = true;
    if (!selCliente.value) { mostrarAviso('Selecciona un cliente para el pedido'); selCliente.focus(); return; }
    if (!carrito.size) { mostrarAviso('Agrega al menos un producto al pedido'); return; }

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'Registrando…';

    const detalle = [...carrito.values()].map(l => ({
      idProducto: l.producto.idProducto,
      cantidad: l.cantidad,
      observaciones: (l.obs || '').trim() || null
    }));

    const r = await api('/Pedido', {
      method: 'POST',
      body: { idCliente: parseInt(selCliente.value, 10), metodoPago: selPago.value, detalle }
    });

    btnConfirmar.disabled = false;
    btnConfirmar.textContent = 'Confirmar pedido';

    if (r.ok && r.data && r.data.numeroError === 0) {
      carrito.clear();
      toast(`Pedido #${r.data.id} registrado correctamente`);
      await cargarProductos();
      mostrarAviso(`Pedido #${r.data.id} registrado correctamente. Las existencias ya se actualizaron.`, 'ok');
    } else {
      await cargarProductos();
      mostrarAviso((r.data && r.data.respuesta) || 'No se pudo registrar el pedido');
    }
  };

  await Promise.all([cargarClientes(), cargarProductos()]);
})();
