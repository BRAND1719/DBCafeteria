/* ---------- Carrusel de imagenes en el inicio de sesion ---------- */
(function carrusel() {
  // Puedes cambiar estas imagenes por fotos propias, por ejemplo 'img/cafeteria1.jpg'
  const IMAGENES = [
    { src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=70', texto: 'Un lugar para disfrutar' },
    { src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=70', texto: 'Café recién preparado' },
    { src: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=70', texto: 'Nuestra cafetería' },
    { src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=70', texto: 'El mejor café de la mañana' },
    { src: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1600&q=70', texto: 'Hecho con cariño' }
  ];
  const SEGUNDOS = 5;

  const caja = document.getElementById('carrusel');
  const puntos = document.getElementById('carrusel-puntos');
  if (!caja) return;

  const slides = [];
  let actual = 0;
  let timer = null;

  IMAGENES.forEach(img => {
    const prueba = new Image();
    prueba.onload = () => {             // solo se agregan las imagenes que si cargan
      const div = document.createElement('div');
      div.className = 'slide';
      div.style.backgroundImage = `url("${img.src}")`;
      div.innerHTML = `<span class="slide-texto">${esc(img.texto)}</span>`;
      caja.appendChild(div);
      slides.push(div);

      const punto = document.createElement('button');
      punto.type = 'button';
      punto.setAttribute('aria-label', 'Imagen ' + slides.length);
      const indice = slides.length - 1;
      punto.onclick = () => { mostrar(indice); reiniciar(); };
      puntos.appendChild(punto);

      if (slides.length === 1) mostrar(0);
      if (slides.length === 2) reiniciar();
    };
    prueba.src = img.src;
  });

  function mostrar(i) {
    actual = (i + slides.length) % slides.length;
    slides.forEach((s, j) => s.classList.toggle('activa', j === actual));
    [...puntos.children].forEach((p, j) => p.classList.toggle('activo', j === actual));
  }

  function reiniciar() {
    clearInterval(timer);
    if (slides.length > 1) timer = setInterval(() => mostrar(actual + 1), SEGUNDOS * 1000);
  }
})();

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
