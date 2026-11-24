// MODULO USUARIOS - Controlador
// GET api/Usuario: lista de usuarios con filtro
// GET api/Usuario/{id}: obtener un usuario
// POST / PUT / DELETE: crear, editar y eliminar usuarios
// POST api/Usuario/login: inicio de sesion (401 si es incorrecto o inactivo)

using CafeteriaAPI.Data;
using CafeteriaAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace CafeteriaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuarioController : ApiBase
    {
        private readonly UsuarioData _data;

        public UsuarioController(UsuarioData data)
        {
            _data = data;
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
            return Resultado(await _data.Crear(modelo));
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
