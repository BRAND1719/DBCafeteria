using System.Text.Json.Serialization;

namespace CafeteriaAPI.Models
{
    public class Usuario
    {
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = "";
        public string Correo { get; set; } = "";

        // Solo se recibe al crear/editar; nunca se regresa en las respuestas
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Contrasena { get; set; }

        public string Rol { get; set; } = "Mesero";
        public bool Estatus { get; set; } = true;
    }

    public class LoginRequest
    {
        public string Correo { get; set; } = "";
        public string Contrasena { get; set; } = "";
    }

    public class LoginRespuesta : RespuestaApi
    {
        public Usuario? usuario { get; set; }
    }
}
