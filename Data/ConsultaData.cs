using CafeteriaAPI.Models;

namespace CafeteriaAPI.Data
{
    public class ConsultaData
    {
        private readonly Db _db;

        public ConsultaData(Db db)
        {
            _db = db;
        }

        public Task<List<ProductoBajo>> ExistenciaBaja(int limite) =>
            _db.Consultar("sp_productosExistenciaBaja", p => p.AddWithValue("@Limite", limite), dr => new ProductoBajo
            {
                IdProducto = dr.Int("IdProducto"),
                Nombre = dr.Str("Nombre"),
                NombreCategoria = dr.Str("NombreCategoria"),
                Precio = dr.Dec("Precio"),
                Existencia = dr.Int("Existencia")
            });

        public Task<List<ProductoVendido>> MasVendidos(int top) =>
            _db.Consultar("sp_productosMasVendidos", p => p.AddWithValue("@Top", top), dr => new ProductoVendido
            {
                IdProducto = dr.Int("IdProducto"),
                Nombre = dr.Str("Nombre"),
                NombreCategoria = dr.Str("NombreCategoria"),
                TotalVendido = dr.Int("TotalVendido"),
                TotalIngresos = dr.Dec("TotalIngresos")
            });

        public Task<Dashboard?> ObtenerDashboard() =>
            _db.ConsultarUno("sp_dashboard", null, dr => new Dashboard
            {
                ClientesActivos = dr.Int("ClientesActivos"),
                ProductosActivos = dr.Int("ProductosActivos"),
                ProductosExistenciaBaja = dr.Int("ProductosExistenciaBaja"),
                PedidosHoy = dr.Int("PedidosHoy"),
                VentasHoy = dr.Dec("VentasHoy"),
                PedidosCancelados = dr.Int("PedidosCancelados")
            });
    }
}
