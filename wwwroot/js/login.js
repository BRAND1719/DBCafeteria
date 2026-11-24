(function () {
  // Si ya hay sesion, entra directo
  if (usuarioActual()) { location.replace('dashboard.html'); return; }

  const form = document.getElementById('login-form');
  const error = document.getElementById('login-error');
  const boton = document.getElementById('btn-entrar');
  const clave = document.getElementById('contrasena');

  document.getElementById('ver-clave').onclick = e => {
    const mostrar = clave.type === 'password';
    clave.type = mostrar ? 'text' : 'password';
    e.target.textContent = mostrar ? 'Ocultar' : 'Mostrar';
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    error.hidden = true;

    const correo = document.getElementById('correo').value.trim();
    if (!correo || !clave.value) {
      error.textContent = 'Escribe tu correo y tu contraseña';
      error.hidden = false;
      return;
    }

    boton.disabled = true;
    boton.textContent = 'Entrando…';
    const r = await api('/Usuario/login', { method: 'POST', body: { correo, contrasena: clave.value } });
    boton.disabled = false;
    boton.textContent = 'Iniciar sesión';

    if (r.ok && r.data && r.data.usuario) {
      guardarSesion(r.data.usuario);
      location.href = 'dashboard.html';
    } else {
      error.textContent = (r.data && r.data.respuesta) || 'No se pudo iniciar sesión';
      error.hidden = false;
      clave.value = '';
      clave.focus();
    }
  });
})();
