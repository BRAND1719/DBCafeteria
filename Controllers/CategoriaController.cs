// MODULO CATEGORIAS - Controlador
// GET api/Categoria (con filtro), GET api/Categoria/{id}
// POST / PUT / DELETE: crear, editar y eliminar categorias

using CafeteriaAPI.Data;
using CafeteriaAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace CafeteriaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriaController : ApiBase
    {
        private readonly CategoriaData _data;

        public CategoriaController(CategoriaData data)
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
            return item == null ? NoEncontrado("La categoria no existe") : Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] Categoria modelo)
        {
            return Resultado(await _data.Crear(modelo));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Editar(int id, [FromBody] Categoria modelo)
        {
            modelo.IdCategoria = id;
            return Resultado(await _data.Editar(modelo));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            return Resultado(await _data.Eliminar(id));
        }
    }
}
