using CafeteriaAPI.Models;

namespace CafeteriaAPI.Data
{
    public class ClienteData
    {
        private readonly Db _db;

        public ClienteData(Db db)
        {
            _db = db;
        }

        private static Cliente Mapear(Microsoft.Data.SqlClient.SqlDataReader dr) => new Cliente
        {
            IdCliente = dr.Int("IdCliente"),
            Nombre = dr.Str("Nombre"),
            Telefono = dr.Str("Telefono"),
            Correo = dr.Str("Correo"),
            Estatus = dr.Bool("Estatus")
        };

        public Task<List<Cliente>> Lista(string filtro) =>
            _db.Consultar("sp_listaClientes", p => p.AddWithValue("@Filtro", filtro), Mapear);

        public Task<Cliente?> Obtener(int id) =>
            _db.ConsultarUno("sp_obtenerCliente", p => p.AddWithValue("@IdCliente", id), Mapear);

        public Task<RespuestaApi> Crear(Cliente m) =>
            _db.Ejecutar("sp_crearCliente", p =>
            {
                p.AddWithValue("@Nombre", m.Nombre ?? "");
                p.AddWithValue("@Telefono", m.Telefono ?? "");
                p.AddWithValue("@Correo", m.Correo ?? "");
                p.AddWithValue("@Estatus", m.Estatus);
            });

        public Task<RespuestaApi> Editar(Cliente m) =>
            _db.Ejecutar("sp_editarCliente", p =>
            {
                p.AddWithValue("@IdCliente", m.IdCliente);
                p.AddWithValue("@Nombre", m.Nombre ?? "");
                p.AddWithValue("@Telefono", m.Telefono ?? "");
                p.AddWithValue("@Correo", m.Correo ?? "");
                p.AddWithValue("@Estatus", m.Estatus);
            });

        public Task<RespuestaApi> Eliminar(int id) =>
            _db.Ejecutar("sp_eliminarCliente", p => p.AddWithValue("@IdCliente", id));
    }
}
