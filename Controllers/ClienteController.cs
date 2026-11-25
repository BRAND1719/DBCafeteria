using CafeteriaAPI.Data;
using CafeteriaAPI.Models;
using CafeteriaAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace CafeteriaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClienteController : ApiBase
    {
        private readonly ClienteData _data;
        private readonly CorreoService _correo;

        public ClienteController(ClienteData data, CorreoService correo)
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
            return item == null ? NoEncontrado("El cliente no existe") : Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] Cliente modelo)
        {
            var r = await _data.Crear(modelo);

            // Si se registro bien, se manda el correo de "registro exitoso"
            if (r.numeroError == 0 && _correo.EnviarRegistroExitoso(modelo.Correo, modelo.Nombre, "Quedaste registrado como cliente de nuestra cafetería."))
            {
                r.respuesta += " Se envió un correo de confirmación a " + modelo.Correo + ".";
            }

            return Resultado(r);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Editar(int id, [FromBody] Cliente modelo)
        {
            modelo.IdCliente = id;
            return Resultado(await _data.Editar(modelo));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            return Resultado(await _data.Eliminar(id));
        }
    }
}
