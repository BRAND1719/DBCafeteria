// MODULO USUARIOS - Acceso a datos
// Procedimientos: sp_listaUsuarios, sp_obtenerUsuario, sp_crearUsuario,
// sp_editarUsuario, sp_eliminarUsuario y sp_loginUsuario

using CafeteriaAPI.Models;

namespace CafeteriaAPI.Data
{
    public class UsuarioData
    {
        private readonly Db _db;

        public UsuarioData(Db db)
        {
            _db = db;
        }

        private static Usuario Mapear(Microsoft.Data.SqlClient.SqlDataReader dr) => new Usuario
        {
            IdUsuario = dr.Int("IdUsuario"),
            Nombre = dr.Str("Nombre"),
            Correo = dr.Str("Correo"),
            Rol = dr.Str("Rol"),
            Estatus = dr.Bool("Estatus")
        };

        // El procedimiento de login no devuelve la columna Estatus.
        // Un resultado de login siempre está activo (WHERE Estatus = 1 en SQL).
        private static Usuario MapearLogin(Microsoft.Data.SqlClient.SqlDataReader dr) => new Usuario
        {
            IdUsuario = dr.Int("IdUsuario"),
            Nombre = dr.Str("Nombre"),
            Correo = dr.Str("Correo"),
            Rol = dr.Str("Rol"),
            Estatus = true
        };

        public Task<List<Usuario>> Lista(string filtro) =>
            _db.Consultar("sp_listaUsuarios", p => p.AddWithValue("@Filtro", filtro), Mapear);

        public Task<Usuario?> Obtener(int id) =>
            _db.ConsultarUno("sp_obtenerUsuario", p => p.AddWithValue("@IdUsuario", id), Mapear);

        public Task<RespuestaApi> Crear(Usuario m) =>
            _db.Ejecutar("sp_crearUsuario", p =>
            {
                p.AddWithValue("@Nombre", m.Nombre ?? "");
                p.AddWithValue("@Correo", m.Correo ?? "");
                p.AddWithValue("@Contrasena", m.Contrasena ?? "");
                p.AddWithValue("@Rol", m.Rol ?? "");
                p.AddWithValue("@Estatus", m.Estatus);
            });

        public Task<RespuestaApi> Editar(Usuario m) =>
            _db.Ejecutar("sp_editarUsuario", p =>
            {
                p.AddWithValue("@IdUsuario", m.IdUsuario);
                p.AddWithValue("@Nombre", m.Nombre ?? "");
                p.AddWithValue("@Correo", m.Correo ?? "");
                p.AddWithValue("@Contrasena", m.Contrasena ?? "");
                p.AddWithValue("@Rol", m.Rol ?? "");
                p.AddWithValue("@Estatus", m.Estatus);
            });

        public Task<RespuestaApi> Eliminar(int id) =>
            _db.Ejecutar("sp_eliminarUsuario", p => p.AddWithValue("@IdUsuario", id));

        public Task<Usuario?> Login(LoginRequest m) =>
            _db.ConsultarUno("sp_loginUsuario", p =>
            {
                p.AddWithValue("@Correo", m.Correo ?? "");
                p.AddWithValue("@Contrasena", m.Contrasena ?? "");
            }, MapearLogin);
    }
}
