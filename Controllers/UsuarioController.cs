using CafeteriaAPI.Data;
using CafeteriaAPI.Models;
using CafeteriaAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace CafeteriaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuarioController : ApiBase
    {
        private readonly UsuarioData _data;
        private readonly CorreoService _correo;

        public UsuarioController(UsuarioData data, CorreoService correo)
        {
            _data = data;
            _correo = correo;
        }

        [HttpGet]
        public async Task<IActionResult> Lista([FromQuery] string? filtro)
        {
            return Ok(await _data.Lista(filtro ?? ""));
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Obtener(int id)
        {
            var item = await _data.Obtener(id);
            return item == null ? NoEncontrado("El usuario no existe") : Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] Usuario modelo)
        {
            var r = await _data.Crear(modelo);

            // Si se registro bien, se manda el correo de "registro exitoso"
            if (r.numeroError == 0 && _correo.EnviarRegistroExitoso(modelo.Correo, modelo.Nombre, $"Ya puedes iniciar sesión en el portal de pedidos con este correo. Rol asignado: {modelo.Rol}."))
            {
                r.respuesta += " Se envió un correo de confirmación a " + modelo.Correo + ".";
            }

            return Resultado(r);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Editar(int id, [FromBody] Usuario modelo)
        {
            modelo.IdUsuario = id;
            return Resultado(await _data.Editar(modelo));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            return Resultado(await _data.Eliminar(id));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest modelo)
        {
            var usuario = await _data.Login(modelo);

            if (usuario == null)
            {
                return Unauthorized(new RespuestaApi
                {
                    numeroError = 401,
                    respuesta = "Correo o contrasena incorrectos, o el usuario esta inactivo"
                });
            }

            return Ok(new LoginRespuesta
            {
                numeroError = 0,
                respuesta = "Inicio de sesion correcto",
                usuario = usuario
            });
        }
    }
}
