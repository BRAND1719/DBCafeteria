// MODULO PEDIDOS - Controlador
// GET api/Pedido: consulta de pedidos con filtros
// GET api/Pedido/{id}: detalle de un pedido
// POST api/Pedido: registrar pedido
// PUT api/Pedido/{id}/cancelar: cancelar pedido

using CafeteriaAPI.Data;
using CafeteriaAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace CafeteriaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PedidoController : ApiBase
    {
        private readonly PedidoData _data;

        public PedidoController(PedidoData data)
        {
            _data = data;
        }

        // Pedidos por cliente, estatus y rango de fechas (dd/mm/yyyy). Todos los filtros son opcionales.
        [HttpGet]
        public async Task<IActionResult> Consultar(
            [FromQuery] int idCliente = 0,
            [FromQuery] string? estatus = "",
            [FromQuery] string? fechaInicio = "",
            [FromQuery] string? fechaFin = "")
        {
            return Ok(await _data.Consultar(idCliente, estatus ?? "", fechaInicio ?? "", fechaFin ?? ""));
        }

        // Pedido con encabezado y detalle
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Obtener(int id)
        {
            var pedido = await _data.Obtener(id);
            return pedido == null ? NoEncontrado("El pedido no existe") : Ok(pedido);
        }

        // Registra encabezado + detalle + descuento de existencias en una sola transaccion
        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] PedidoCrear modelo)
        {
            return Resultado(await _data.Crear(modelo));
        }

        // Cancela el pedido y recupera las existencias
        [HttpPut("{id:int}/cancelar")]
        public async Task<IActionResult> Cancelar(int id)
        {
            return Resultado(await _data.Cancelar(id));
        }
    }
}
