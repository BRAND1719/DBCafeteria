// MODULO CLIENTES - Controlador
// GET api/Cliente (con filtro), GET api/Cliente/{id}
// POST / PUT / DELETE: crear, editar y eliminar clientes

using CafeteriaAPI.Data;
using CafeteriaAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace CafeteriaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClienteController : ApiBase
    {
        private readonly ClienteData _data;

        public ClienteController(ClienteData data)
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
            return item == null ? NoEncontrado("El cliente no existe") : Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] Cliente modelo)
        {
            return Resultado(await _data.Crear(modelo));
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
