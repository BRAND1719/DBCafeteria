namespace CafeteriaAPI.Models
{
    // Lo que manda el frontend para registrar un pedido
    public class PedidoCrear
    {
        public int IdCliente { get; set; }
        public string MetodoPago { get; set; } = "Efectivo";
        public List<DetalleCrear> Detalle { get; set; } = new();
    }

    public class DetalleCrear
    {
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public string? Observaciones { get; set; }
    }

    public class PedidoResumen
    {
        public int IdPedido { get; set; }
        public int IdCliente { get; set; }
        public string NombreCliente { get; set; } = "";
        public string Fecha { get; set; } = "";
        public string Hora { get; set; } = "";
        public string MetodoPago { get; set; } = "";
        public decimal Total { get; set; }
        public string Estatus { get; set; } = "";
    }

    public class PedidoDetalleItem
    {
        public int IdDetalle { get; set; }
        public int IdProducto { get; set; }
        public string NombreProducto { get; set; } = "";
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
        public string Observaciones { get; set; } = "";
    }

    public class PedidoCompleto : PedidoResumen
    {
        public string FechaCancelacion { get; set; } = "";
        public List<PedidoDetalleItem> Detalle { get; set; } = new();
    }

    public class Dashboard
    {
        public int ClientesActivos { get; set; }
        public int ProductosActivos { get; set; }
        public int ProductosExistenciaBaja { get; set; }
        public int PedidosHoy { get; set; }
        public decimal VentasHoy { get; set; }
        public int PedidosCancelados { get; set; }
    }
}
