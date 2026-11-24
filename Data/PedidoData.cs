using System.Data;
using System.Text.Json;
using CafeteriaAPI.Models;
using Microsoft.Data.SqlClient;

namespace CafeteriaAPI.Data
{
    public class PedidoData
    {
        private readonly Db _db;

        public PedidoData(Db db)
        {
            _db = db;
        }

        private static PedidoResumen MapearResumen(SqlDataReader dr) => new PedidoResumen
        {
            IdPedido = dr.Int("IdPedido"),
            IdCliente = dr.Int("IdCliente"),
            NombreCliente = dr.Str("NombreCliente"),
            Fecha = dr.Str("Fecha"),
            Hora = dr.Str("Hora"),
            MetodoPago = dr.Str("MetodoPago"),
            Total = dr.Dec("Total"),
            Estatus = dr.Str("Estatus")
        };

        public Task<List<PedidoResumen>> Consultar(int idCliente, string estatus, string fechaInicio, string fechaFin) =>
            _db.Consultar("sp_consultarPedidos", p =>
            {
                p.AddWithValue("@IdCliente", idCliente);
                p.AddWithValue("@Estatus", estatus);
                p.AddWithValue("@FechaInicio", fechaInicio);
                p.AddWithValue("@FechaFin", fechaFin);
            }, MapearResumen);

        // sp_obtenerPedido regresa dos resultados: encabezado y detalle
        public async Task<PedidoCompleto?> Obtener(int id)
        {
            using var con = _db.CrearConexion();
            await con.OpenAsync();

            using var cmd = new SqlCommand("sp_obtenerPedido", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdPedido", id);

            using var dr = await cmd.ExecuteReaderAsync();

            PedidoCompleto? pedido = null;

            if (await dr.ReadAsync())
            {
                pedido = new PedidoCompleto
                {
                    IdPedido = dr.Int("IdPedido"),
                    IdCliente = dr.Int("IdCliente"),
                    NombreCliente = dr.Str("NombreCliente"),
                    Fecha = dr.Str("Fecha"),
                    Hora = dr.Str("Hora"),
                    MetodoPago = dr.Str("MetodoPago"),
                    Total = dr.Dec("Total"),
                    Estatus = dr.Str("Estatus"),
                    FechaCancelacion = dr.Str("FechaCancelacion")
                };
            }

            if (pedido != null && await dr.NextResultAsync())
            {
                while (await dr.ReadAsync())
                {
                    pedido.Detalle.Add(new PedidoDetalleItem
                    {
                        IdDetalle = dr.Int("IdDetalle"),
                        IdProducto = dr.Int("IdProducto"),
                        NombreProducto = dr.Str("NombreProducto"),
                        Cantidad = dr.Int("Cantidad"),
                        PrecioUnitario = dr.Dec("PrecioUnitario"),
                        Subtotal = dr.Dec("Subtotal"),
                        Observaciones = dr.Str("Observaciones")
                    });
                }
            }

            return pedido;
        }

        public async Task<RespuestaApi> Crear(PedidoCrear m)
        {
            // El detalle viaja al SP como JSON (nombres de propiedad tal cual: IdProducto, Cantidad, Observaciones)
            var detalleJson = JsonSerializer.Serialize(
                (m.Detalle ?? new List<DetalleCrear>()).Select(d => new { d.IdProducto, d.Cantidad, d.Observaciones }));

            var pIdPedido = new SqlParameter("@IdPedido", SqlDbType.Int) { Direction = ParameterDirection.Output };

            var respuesta = await _db.Ejecutar("sp_crearPedido", p =>
            {
                p.AddWithValue("@IdCliente", m.IdCliente);
                p.AddWithValue("@MetodoPago", m.MetodoPago ?? "");
                p.AddWithValue("@Detalle", detalleJson);
                p.Add(pIdPedido);
            });

            respuesta.id = pIdPedido.Value is int idPedido ? idPedido : 0;
            return respuesta;
        }

        public Task<RespuestaApi> Cancelar(int id) =>
            _db.Ejecutar("sp_cancelarPedido", p => p.AddWithValue("@IdPedido", id));
    }
}
