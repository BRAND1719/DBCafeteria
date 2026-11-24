using CafeteriaAPI.Data;
using CafeteriaAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace CafeteriaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductoController : ApiBase
    {
        private readonly ProductoData _data;

        public ProductoController(ProductoData data)
        {
            _data = data;
        }

        [HttpGet]
        public async Task<IActionResult> Lista([FromQuery] string? filtro, [FromQuery] int idCategoria = 0)
        {
            return Ok(await _data.Lista(filtro ?? "", idCategoria));
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Obtener(int id)
        {
            var item = await _data.Obtener(id);
            return item == null ? NoEncontrado("El producto no existe") : Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] Producto modelo)
        {
            return Resultado(await _data.Crear(modelo));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Editar(int id, [FromBody] Producto modelo)
        {
            modelo.IdProducto = id;
            return Resultado(await _data.Editar(modelo));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            return Resultado(await _data.Eliminar(id));
        }
    }
}
