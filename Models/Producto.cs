namespace CafeteriaAPI.Models
{
    public class Producto
    {
        public int IdProducto { get; set; }
        public int IdCategoria { get; set; }
        public string NombreCategoria { get; set; } = "";
        public string Nombre { get; set; } = "";
        public string Descripcion { get; set; } = "";
        public decimal Precio { get; set; }
        public int Existencia { get; set; }
        public bool Estatus { get; set; } = true;
    }

    public class ProductoBajo
    {
        public int IdProducto { get; set; }
        public string Nombre { get; set; } = "";
        public string NombreCategoria { get; set; } = "";
        public decimal Precio { get; set; }
        public int Existencia { get; set; }
    }

    public class ProductoVendido
    {
        public int IdProducto { get; set; }
        public string Nombre { get; set; } = "";
        public string NombreCategoria { get; set; } = "";
        public int TotalVendido { get; set; }
        public decimal TotalIngresos { get; set; }
    }
}
