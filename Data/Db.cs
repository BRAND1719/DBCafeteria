using System.Data;
using CafeteriaAPI.Models;
using Microsoft.Data.SqlClient;

namespace CafeteriaAPI.Data
{
    // Unico lugar donde se abre la conexion y se ejecutan procedimientos almacenados
    public class Db
    {
        private readonly string _cadenaSQL;

        public Db(IConfiguration configuration)
        {
            _cadenaSQL = configuration.GetConnectionString("CadenaSQL")
                ?? throw new InvalidOperationException("Falta la cadena de conexion 'CadenaSQL' en appsettings.json");
        }

        public SqlConnection CrearConexion() => new SqlConnection(_cadenaSQL);

        // Ejecuta un SP que regresa filas y las convierte a una lista
        public async Task<List<T>> Consultar<T>(string procedimiento, Action<SqlParameterCollection>? parametros, Func<SqlDataReader, T> mapear)
        {
            var lista = new List<T>();

            using var con = CrearConexion();
            await con.OpenAsync();

            using var cmd = new SqlCommand(procedimiento, con) { CommandType = CommandType.StoredProcedure };
            parametros?.Invoke(cmd.Parameters);

            using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                lista.Add(mapear(dr));
            }

            return lista;
        }

        public async Task<T?> ConsultarUno<T>(string procedimiento, Action<SqlParameterCollection>? parametros, Func<SqlDataReader, T> mapear)
        {
            var lista = await Consultar(procedimiento, parametros, mapear);
            return lista.FirstOrDefault();
        }

        // Ejecuta un SP de insertar/editar/eliminar con @numeroError y @respuesta OUTPUT
        public async Task<RespuestaApi> Ejecutar(string procedimiento, Action<SqlParameterCollection> parametros)
        {
            using var con = CrearConexion();
            await con.OpenAsync();

            using var cmd = new SqlCommand(procedimiento, con) { CommandType = CommandType.StoredProcedure };
            parametros(cmd.Parameters);

            var pError = new SqlParameter("@numeroError", SqlDbType.Int) { Direction = ParameterDirection.Output };
            var pRespuesta = new SqlParameter("@respuesta", SqlDbType.VarChar, 1000) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pError);
            cmd.Parameters.Add(pRespuesta);

            await cmd.ExecuteNonQueryAsync();

            return new RespuestaApi
            {
                numeroError = pError.Value is int numero ? numero : -1,
                respuesta = pRespuesta.Value as string ?? "Sin respuesta del procedimiento"
            };
        }
    }

    // Lectura segura de columnas (maneja NULL)
    public static class LectorExtensions
    {
        public static string Str(this SqlDataReader r, string columna)
        {
            int i = r.GetOrdinal(columna);
            return r.IsDBNull(i) ? "" : r.GetString(i);
        }

        public static int Int(this SqlDataReader r, string columna)
        {
            int i = r.GetOrdinal(columna);
            return r.IsDBNull(i) ? 0 : r.GetInt32(i);
        }

        public static decimal Dec(this SqlDataReader r, string columna)
        {
            int i = r.GetOrdinal(columna);
            return r.IsDBNull(i) ? 0 : r.GetDecimal(i);
        }

        public static bool Bool(this SqlDataReader r, string columna)
        {
            int i = r.GetOrdinal(columna);
            return !r.IsDBNull(i) && r.GetBoolean(i);
        }
    }
}
