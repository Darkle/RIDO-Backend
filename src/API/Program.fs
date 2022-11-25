module API.App

open System
open System.IO
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Cors.Infrastructure
open Microsoft.AspNetCore.Hosting
open Microsoft.Extensions.Hosting
open Microsoft.Extensions.Logging
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.FileProviders
open Giraffe
open Fable.Remoting.Server
open Fable.Remoting.Giraffe
open API.Impl

let apiServerPort = DotNetEnv.Env.GetInt("API_SERVICE_PORT", 3030)
let apiServerAddress = sprintf "http://localhost:%i" apiServerPort

let routeBuilder (typeName: string) (methodName: string) =
    sprintf "/api/%s/%s" typeName methodName

let remoting =
    Remoting.createApi ()
    |> Remoting.withRouteBuilder routeBuilder
    |> Remoting.fromValue api
    |> Remoting.buildHttpHandler

let webApp =
    choose
        [
          //TODO: Do qr-code page
          //TODO: It should go above any auth/token check so its always accessible
          routeCix "/qr-code" >=> text "QR Code Goes Here"

          remoting

          // If none of the routes matched then return a 404
          setStatusCode 404 >=> text "Not Found" ]

let errorHandler (ex: Exception) (giraffeLogger: ILogger) =
    let errorMessage =
        "An unhandled exception has occurred while executing the request."

    giraffeLogger.LogError(ex, errorMessage)

    clearResponse >=> setStatusCode 500 >=> text ex.Message

let configureCors (builder: CorsPolicyBuilder) =
    builder.WithOrigins(apiServerAddress).AllowAnyMethod().AllowAnyHeader()
    |> ignore

let configureApp (app: IApplicationBuilder) =
    let env = app.ApplicationServices.GetService<IWebHostEnvironment>()

    let mediaDir =
        Utils.getProperEnvVarFilePath (DotNetEnv.Env.GetString("MEDIA_DOWNLOADS_FOLDER", "./media-downloads"))

    (match env.IsDevelopment() with
     | true -> app.UseDeveloperExceptionPage()
     | false -> app.UseGiraffeErrorHandler(errorHandler))
        .UseCors(configureCors)
        .UseHealthChecks("/isup")
        .UseStaticFiles(StaticFileOptions(FileProvider = new PhysicalFileProvider(mediaDir), RequestPath = "/media"))
        .UseGiraffe(webApp)

let configureServices (services: IServiceCollection) =
    services.AddHealthChecks() |> ignore
    services.AddCors() |> ignore
    services.AddGiraffe() |> ignore

let configureLogging (builder: ILoggingBuilder) =
    builder.AddConsole().AddDebug() |> ignore

[<EntryPoint>]
let main args =
    Utils.loadDotEnvFile args

    Log.warn
        { message = Some "Hello"
          service = None
          stack = None
          other = Some({| hello = "derp" |}) }

    let contentRoot = Directory.GetCurrentDirectory()
    let webRoot = Path.Combine(contentRoot, "WebRoot")

    Host
        .CreateDefaultBuilder(args)
        .ConfigureWebHostDefaults(fun webHostBuilder ->
            webHostBuilder
                .UseContentRoot(contentRoot)
                .UseWebRoot(webRoot)
                .UseUrls(apiServerAddress)
                .Configure(Action<IApplicationBuilder> configureApp)
                .ConfigureServices(configureServices)
                .ConfigureLogging(configureLogging)
            |> ignore)
        .Build()
        .Run()

    0
