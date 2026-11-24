using System.Text.Json.Serialization;

namespace CafeteriaAPI.Models
{
    public class RespuestaApi
    {
        public int numeroError { get; set; }
        public string respuesta { get; set; } = "";

        // Se usa para regresar el IdPedido recien creado
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? id { get; set; }
    }
}
