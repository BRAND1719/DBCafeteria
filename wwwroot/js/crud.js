/* =====================================================================
   crud.js - motor reutilizable para los catalogos
   (clientes, categorias, productos, usuarios)
   ===================================================================== */
function iniciarCrud(cfg) {
  const thead = document.querySelector('#tabla thead');
  const tbody = document.querySelector('#tabla tbody');
  const buscar = document.getElementById('buscar');
  const filtrosBox = document.getElementById('filtros-extra');
  const btnNuevo = document.getElementById('btn-nuevo');

  let items = [];
  let editando = null;
  const filtrosExtra = {};
  const opcionesCache = {};

  /* ----- encabezado de la tabla ----- */
  thead.innerHTML = '<tr>' +
    cfg.columnas.map(c => `<th class="${c.numerico ? 'num' : ''}">${esc(c.titulo)}</th>`).join('') +
    '<th class="col-acciones">Acciones</th></tr>';

  /* ----- dialogo con el formulario ----- */
  const dlg = document.createElement('dialog');
  dlg.className = 'dialogo';
  dlg.innerHTML = `
    <form id="crud-form">
      <div class="dialogo-cab"><h2 id="crud-titulo"></h2><button type="button" class="cerrar" data-cerrar aria-label="Cerrar">×</button></div>
      <div class="dialogo-cuerpo">
        <div id="crud-error" class="aviso aviso-error" hidden></div>
        <div class="form-grid" id="crud-campos"></div>
      </div>
      <div class="dialogo-pie">
        <button type="button" class="btn btn-secundario" data-cerrar>Cancelar</button>
        <button type="submit" class="btn btn-primario" id="crud-guardar">Guardar</button>
      </div>
    </form>`;
  document.body.appendChild(dlg);

  const form = dlg.querySelector('#crud-form');
  const camposBox = dlg.querySelector('#crud-campos');
  const errorBox = dlg.querySelector('#crud-error');
  const btnGuardar = dlg.querySelector('#crud-guardar');
  dlg.querySelectorAll('[data-cerrar]').forEach(b => b.onclick = () => dlg.close());

  /* ----- opciones de los select (se cargan una vez) ----- */
  const cargaOpciones = Promise.all(cfg.campos.filter(f => typeof f.opciones === 'function').map(async f => {
    opcionesCache[f.campo] = await f.opciones();
  }));

  /* ----- filtros extra de la barra (ej. categoria en productos) ----- */
  (cfg.filtrosExtra || []).forEach(async f => {
    const sel = document.createElement('select');
    sel.innerHTML = `<option value="">${esc(f.etiqueta)}</option>`;
    filtrosBox.appendChild(sel);
    (await f.cargar()).forEach(o => sel.insertAdjacentHTML('beforeend', `<option value="${esc(o.valor)}">${esc(o.texto)}</option>`));
    sel.onchange = () => { filtrosExtra[f.parametro] = sel.value; cargar(); };
  });

  /* ----- listado ----- */
  async function cargar() {
    tbody.innerHTML = `<tr><td colspan="${cfg.columnas.length + 1}" class="vacio">Cargando…</td></tr>`;
    const r = await api(cfg.ruta + qs({ filtro: buscar.value.trim(), ...filtrosExtra }));
    if (!r.ok) {
      tbody.innerHTML = `<tr><td colspan="${cfg.columnas.length + 1}" class="vacio">No se pudo cargar la información</td></tr>`;
      toast(r.data?.respuesta || 'No se pudo cargar la información', 'error');
      return;
    }
    items = r.data;
    pintar();
  }

  function pintar() {
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="${cfg.columnas.length + 1}" class="vacio">No hay ${esc(cfg.plural)} para mostrar</td></tr>`;
      return;
    }
    tbody.innerHTML = items.map((item, i) => `
      <tr>
        ${cfg.columnas.map(c => `<td class="${c.numerico ? 'num' : ''}">${c.render ? c.render(item) : esc(item[c.campo])}</td>`).join('')}
        <td class="col-acciones">
          <button class="btn btn-secundario btn-chico" data-editar="${i}">Editar</button>
          <button class="btn btn-peligro btn-chico" data-eliminar="${i}">Eliminar</button>
        </td>
      </tr>`).join('');
  }

  tbody.addEventListener('click', e => {
    const bEditar = e.target.closest('[data-editar]');
    const bEliminar = e.target.closest('[data-eliminar]');
    if (bEditar) abrirFormulario(items[+bEditar.dataset.editar]);
    if (bEliminar) eliminar(items[+bEliminar.dataset.eliminar]);
  });

  /* ----- formulario ----- */
  function campoHtml(f, valor, nuevo) {
    const requerido = f.requerido || (f.requeridoAlCrear && nuevo);
    const id = 'f_' + f.campo;
    const comun = `id="${id}" name="${f.campo}" ${requerido ? 'required' : ''}`;
    let control;

    if (f.tipo === 'estatus') {
      control = `<select ${comun}>
        <option value="true" ${valor !== false ? 'selected' : ''}>Activo</option>
        <option value="false" ${valor === false ? 'selected' : ''}>Inactivo</option></select>`;
    } else if (f.tipo === 'select') {
      const ops = f.opciones && typeof f.opciones !== 'function' ? f.opciones : (opcionesCache[f.campo] || []);
      control = `<select ${comun}><option value="">Selecciona…</option>` +
        ops.map(o => `<option value="${esc(o.valor)}" ${String(o.valor) === String(valor) ? 'selected' : ''}>${esc(o.texto)}</option>`).join('') +
        '</select>';
    } else if (f.tipo === 'textarea') {
      control = `<textarea ${comun} rows="3" maxlength="${f.max || 200}">${esc(valor ?? '')}</textarea>`;
    } else {
      const tipo = f.tipo || 'text';
      const extra = [
        f.max ? `maxlength="${f.max}"` : '',
        f.min !== undefined ? `min="${f.min}"` : '',
        f.paso ? `step="${f.paso}"` : '',
        f.tipo === 'password' ? 'autocomplete="new-password"' : ''
      ].join(' ');
      const placeholder = (f.tipo === 'password' && !nuevo) ? 'Dejar vacío para conservar la actual' : (f.placeholder || '');
      control = `<input type="${tipo}" ${comun} ${extra} placeholder="${esc(placeholder)}" value="${tipo === 'password' ? '' : esc(valor ?? '')}">`;
    }

    return `<div class="campo ${f.completo ? 'completo' : ''}"><label for="${id}">${esc(f.etiqueta)}${requerido ? ' *' : ''}</label>${control}</div>`;
  }

  async function abrirFormulario(item) {
    await cargaOpciones;
    editando = item || null;
    errorBox.hidden = true;
    dlg.querySelector('#crud-titulo').textContent = (editando ? 'Editar ' : 'Nuevo ') + cfg.entidad.toLowerCase();
    camposBox.innerHTML = cfg.campos.map(f => campoHtml(f, editando ? editando[f.campo] : undefined, !editando)).join('');
    dlg.showModal();
    const primero = camposBox.querySelector('input, select, textarea');
    if (primero) primero.focus();
  }

  function leerFormulario() {
    const datos = {};
    cfg.campos.forEach(f => {
      const valor = form.elements[f.campo].value;
      if (f.tipo === 'estatus') datos[f.campo] = valor === 'true';
      else if (f.tipo === 'number') datos[f.campo] = f.entero ? (parseInt(valor, 10) || 0) : (parseFloat(valor) || 0);
      else if (f.numero) datos[f.campo] = parseInt(valor, 10) || 0;
      else if (f.tipo === 'password') datos[f.campo] = valor;
      else datos[f.campo] = valor.trim();
    });
    return datos;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorBox.hidden = true;
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando…';

    const datos = leerFormulario();
    const r = editando
      ? await api(`${cfg.ruta}/${editando[cfg.id]}`, { method: 'PUT', body: datos })
      : await api(cfg.ruta, { method: 'POST', body: datos });

    btnGuardar.disabled = false;
    btnGuardar.textContent = 'Guardar';

    if (r.ok && r.data && r.data.numeroError === 0) {
      dlg.close();
      toast(r.data.respuesta);
      cargar();
    } else {
      errorBox.textContent = (r.data && r.data.respuesta) || 'Ocurrió un error al guardar';
      errorBox.hidden = false;
    }
  });

  async function eliminar(item) {
    const nombre = item.nombre || '';
    if (!await confirmar(`¿Eliminar ${cfg.entidad.toLowerCase()} "${nombre}"? Esta acción no se puede deshacer.`, 'Eliminar')) return;
    const r = await api(`${cfg.ruta}/${item[cfg.id]}`, { method: 'DELETE' });
    if (r.ok && r.data && r.data.numeroError === 0) {
      toast(r.data.respuesta);
      cargar();
    } else {
      toast((r.data && r.data.respuesta) || 'No se pudo eliminar', 'error');
    }
  }

  buscar.addEventListener('input', debounce(cargar));
  btnNuevo.addEventListener('click', () => abrirFormulario(null));
  cargar();
}
