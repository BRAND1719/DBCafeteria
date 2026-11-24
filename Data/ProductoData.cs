// MODULO PRODUCTOS - Acceso a datos
// Procedimientos: sp_listaProductos, sp_obtenerProducto, sp_crearProducto,
// sp_editarProducto y sp_eliminarProducto

using CafeteriaAPI.Models;

namespace CafeteriaAPI.Data
{
    public class ProductoData
    {
        private readonly Db _db;

        public ProductoData(Db db)
        {
            _db = db;
        }

        private static Producto Mapear(Microsoft.Data.SqlClient.SqlDataReader dr) => new Producto
        {
            IdProducto = dr.Int("IdProducto"),
            IdCategoria = dr.Int("IdCategoria"),
            NombreCategoria = dr.Str("NombreCategoria"),
            Nombre = dr.Str("Nombre"),
            Descripcion = dr.Str("Descripcion"),
            Precio = dr.Dec("Precio"),
            Existencia = dr.Int("Existencia"),
            Estatus = dr.Bool("Estatus")
        };

        public Task<List<Producto>> Lista(string filtro, int idCategoria) =>
            _db.Consultar("sp_listaProductos", p =>
            {
                p.AddWithValue("@Filtro", filtro);
                p.AddWithValue("@IdCategoria", idCategoria);
            }, Mapear);

        public Task<Producto?> Obtener(int id) =>
            _db.ConsultarUno("sp_obtenerProducto", p => p.AddWithValue("@IdProducto", id), Mapear);

        public Task<RespuestaApi> Crear(Producto m) =>
            _db.Ejecutar("sp_crearProducto", p =>
            {
                p.AddWithValue("@IdCategoria", m.IdCategoria);
                p.AddWithValue("@Nombre", m.Nombre ?? "");
                p.AddWithValue("@Descripcion", m.Descripcion ?? "");
                p.AddWithValue("@Precio", m.Precio);
                p.AddWithValue("@Existencia", m.Existencia);
                p.AddWithValue("@Estatus", m.Estatus);
            });

        public Task<RespuestaApi> Editar(Producto m) =>
            _db.Ejecutar("sp_editarProducto", p =>
            {
                p.AddWithValue("@IdProducto", m.IdProducto);
                p.AddWithValue("@IdCategoria", m.IdCategoria);
                p.AddWithValue("@Nombre", m.Nombre ?? "");
                p.AddWithValue("@Descripcion", m.Descripcion ?? "");
                p.AddWithValue("@Precio", m.Precio);
                p.AddWithValue("@Existencia", m.Existencia);
                p.AddWithValue("@Estatus", m.Estatus);
            });

        public Task<RespuestaApi> Eliminar(int id) =>
            _db.Ejecutar("sp_eliminarProducto", p => p.AddWithValue("@IdProducto", id));
    }
}
