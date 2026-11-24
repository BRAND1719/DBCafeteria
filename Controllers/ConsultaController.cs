using CafeteriaAPI.Data;
using Microsoft.AspNetCore.Mvc;

namespace CafeteriaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConsultaController : ApiBase
    {
        private readonly ConsultaData _data;

        public ConsultaController(ConsultaData data)
        {
            _data = data;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            return Ok(await _data.ObtenerDashboard());
        }

        [HttpGet("existencia-baja")]
        public async Task<IActionResult> ExistenciaBaja([FromQuery] int limite = 5)
        {
            return Ok(await _data.ExistenciaBaja(limite));
        }

        [HttpGet("mas-vendidos")]
        public async Task<IActionResult> MasVendidos([FromQuery] int top = 10)
        {
            return Ok(await _data.MasVendidos(top));
        }
    }
}
