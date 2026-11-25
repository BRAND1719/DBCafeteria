using CafeteriaAPI.Data;
using CafeteriaAPI.Models;
using CafeteriaAPI.Services;
using Microsoft.AspNetCore.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Acceso a datos (la cadena de conexion vive solo en appsettings.json)
builder.Services.AddSingleton<Db>();
builder.Services.AddScoped<ClienteData>();
builder.Services.AddScoped<CategoriaData>();
builder.Services.AddScoped<ProductoData>();
builder.Services.AddScoped<UsuarioData>();
builder.Services.AddScoped<PedidoData>();
builder.Services.AddScoped<ConsultaData>();

// Correo de confirmacion de registro (configuracion en la seccion "Correo")
builder.Services.AddSingleton<CorreoService>();

// CORS: los origenes permitidos se configuran en appsettings.json ("Cors:Origenes")
var origenes = builder.Configuration.GetSection("Cors:Origenes").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(opciones =>
{
    opciones.AddPolicy("Frontend", politica =>
    {
        politica.WithOrigins(origenes).AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// Cualquier error no controlado regresa JSON con numeroError y respuesta
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async contexto =>
    {
        var error = contexto.Features.Get<IExceptionHandlerFeature>()?.Error;
        app.Logger.LogError(error, "Error no controlado");

        contexto.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await contexto.Response.WriteAsJsonAsync(new RespuestaApi
        {
            numeroError = 500,
            // En desarrollo se muestra el error real para poder corregirlo; en produccion, un mensaje generico
            respuesta = app.Environment.IsDevelopment() && error != null
                ? "Error del servidor: " + error.Message
                : "Ocurrio un error en el servidor. Revisa la conexion con la base de datos."
        });
    });
});

// Sirve el frontend (carpeta wwwroot). index.html es la pagina de inicio (login)
app.UseDefaultFiles();
var tiposEstaticos = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
tiposEstaticos.Mappings[".webmanifest"] = "application/manifest+json";
app.UseStaticFiles(new StaticFileOptions { ContentTypeProvider = tiposEstaticos });

app.UseCors("Frontend");
app.MapControllers();

app.Run();
