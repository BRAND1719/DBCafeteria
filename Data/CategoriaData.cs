using CafeteriaAPI.Models;

namespace CafeteriaAPI.Data
{
    public class CategoriaData
    {
        private readonly Db _db;

        public CategoriaData(Db db)
        {
            _db = db;
        }

        private static Categoria Mapear(Microsoft.Data.SqlClient.SqlDataReader dr) => new Categoria
        {
            IdCategoria = dr.Int("IdCategoria"),
            Nombre = dr.Str("Nombre"),
            Descripcion = dr.Str("Descripcion"),
            Estatus = dr.Bool("Estatus")
        };

        public Task<List<Categoria>> Lista(string filtro) =>
            _db.Consultar("sp_listaCategorias", p => p.AddWithValue("@Filtro", filtro), Mapear);

        public Task<Categoria?> Obtener(int id) =>
            _db.ConsultarUno("sp_obtenerCategoria", p => p.AddWithValue("@IdCategoria", id), Mapear);

        public Task<RespuestaApi> Crear(Categoria m) =>
            _db.Ejecutar("sp_crearCategoria", p =>
            {
                p.AddWithValue("@Nombre", m.Nombre ?? "");
                p.AddWithValue("@Descripcion", m.Descripcion ?? "");
                p.AddWithValue("@Estatus", m.Estatus);
            });

        public Task<RespuestaApi> Editar(Categoria m) =>
            _db.Ejecutar("sp_editarCategoria", p =>
            {
                p.AddWithValue("@IdCategoria", m.IdCategoria);
                p.AddWithValue("@Nombre", m.Nombre ?? "");
                p.AddWithValue("@Descripcion", m.Descripcion ?? "");
                p.AddWithValue("@Estatus", m.Estatus);
            });

        public Task<RespuestaApi> Eliminar(int id) =>
            _db.Ejecutar("sp_eliminarCategoria", p => p.AddWithValue("@IdCategoria", id));
    }
}
