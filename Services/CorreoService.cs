using System.Net;
using System.Net.Mail;

namespace CafeteriaAPI.Services
{
    // Envia el correo de "registro exitoso" cuando se crea un usuario o un cliente.
    // Los datos del correo remitente se configuran en la seccion "Correo" de appsettings.json
    // o, en Azure, en Variables de entorno: Correo__Usuario y Correo__Contrasena.
    public class CorreoService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<CorreoService> _logger;

        public CorreoService(IConfiguration config, ILogger<CorreoService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public bool Configurado =>
            !string.IsNullOrWhiteSpace(_config["Correo:Usuario"]) &&
            !string.IsNullOrWhiteSpace(_config["Correo:Contrasena"]);

        // Se envia en segundo plano: si el correo falla, el registro NO se cancela.
        // Regresa true si el correo se mando a la cola de envio.
        public bool EnviarRegistroExitoso(string correo, string nombre, string detalle)
        {
            if (string.IsNullOrWhiteSpace(correo)) return false;
            if (!Configurado)
            {
                _logger.LogWarning("No se envio el correo de registro a {Correo}: falta configurar la seccion Correo", correo);
                return false;
            }

            var nombreSeguro = WebUtility.HtmlEncode(nombre);
            var detalleSeguro = WebUtility.HtmlEncode(detalle);
            var html = $@"
<div style=""font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #d8e5df;border-radius:12px;overflow:hidden"">
  <div style=""background:#123c3a;color:#fff;padding:22px 26px;font-size:20px;font-weight:bold"">&#9749; Cafetería</div>
  <div style=""padding:24px 26px;color:#18302e;font-size:15px;line-height:1.5"">
    <p>Hola <strong>{nombreSeguro}</strong>,</p>
    <p>Te confirmamos que <strong>tu registro se realizó exitosamente</strong>.</p>
    <p style=""color:#637b75"">{detalleSeguro}</p>
    <p>¡Gracias por formar parte de nuestra cafetería!</p>
  </div>
  <div style=""background:#f4f7f4;color:#637b75;padding:12px 26px;font-size:12px"">Este es un mensaje automático, no es necesario responder.</div>
</div>";

            _ = Task.Run(async () =>
            {
                try
                {
                    await Enviar(correo.Trim(), "Registro exitoso - Cafetería", html);
                    _logger.LogInformation("Correo de registro enviado a {Correo}", correo);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "No se pudo enviar el correo de registro a {Correo}", correo);
                }
            });
            return true;
        }

        private async Task Enviar(string para, string asunto, string html)
        {
            var usuario = _config["Correo:Usuario"]!;
            var servidor = _config["Correo:Servidor"] ?? "smtp.gmail.com";
            var puerto = int.TryParse(_config["Correo:Puerto"], out var p) ? p : 587;
            var remitente = _config["Correo:NombreRemitente"] ?? "Cafetería";

            using var mensaje = new MailMessage
            {
                From = new MailAddress(usuario, remitente),
                Subject = asunto,
                Body = html,
                IsBodyHtml = true
            };
            mensaje.To.Add(para);

            using var smtp = new SmtpClient(servidor, puerto)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(usuario, _config["Correo:Contrasena"])
            };
            await smtp.SendMailAsync(mensaje);
        }
    }
}
