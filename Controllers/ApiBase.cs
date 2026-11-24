using CafeteriaAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace CafeteriaAPI.Controllers
{
    public class ApiBase : ControllerBase
    {
        // numeroError = 0 -> 200 OK; cualquier otro valor -> 400 con numeroError y respuesta
        protected IActionResult Resultado(RespuestaApi r) =>
            r.numeroError == 0 ? Ok(r) : BadRequest(r);

        protected IActionResult NoEncontrado(string mensaje) =>
            NotFound(new RespuestaApi { numeroError = 404, respuesta = mensaje });
    }
}
