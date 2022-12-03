module API.App

open System
open System.IO
open Microsoft.AspNetCore.Http
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

let remoting =
    Remoting.createApi ()
    |> Remoting.fromValue api
    // |> Remoting.withDiagnosticsLogger (printfn "%s")
    |> Remoting.buildHttpHandler

let webApp =
    choose
        [ remoting
          // If none of the routes matched then return a 404
          setStatusCode StatusCodes.Status404NotFound >=> text "Not Found" ]

let errorHandler (ex: Exception) (giraffeLogger: ILogger) =
    let errorMessage =
        "An unhandled exception has occurred while executing the request."

    giraffeLogger.LogError(ex, errorMessage)

    Log.error
        { message = Some errorMessage
          service = Some "api"
          stack = Some ex.StackTrace
          other = Some ex.Message }

    clearResponse >=> setStatusCode 500 >=> text ex.Message

let configureCors (builder: CorsPolicyBuilder) =
    builder.WithOrigins(Utils.apiServerAddress ()).AllowAnyMethod().AllowAnyHeader()
    |> ignore

let configureApp (app: IApplicationBuilder) =
    let env = app.ApplicationServices.GetService<IWebHostEnvironment>()

    let mediaDir =
        Utils.getProperEnvVarFilePath (DotNetEnv.Env.GetString("MEDIA_DOWNLOADS_FOLDER", "./media-downloads"))

    (if env.IsDevelopment() then
         app.UseDeveloperExceptionPage()
     else
         app.UseGiraffeErrorHandler(errorHandler))
        .UseCors(configureCors)
        .UseHealthChecks("/isup")
        .UseStaticFiles(StaticFileOptions(FileProvider = new PhysicalFileProvider(mediaDir), RequestPath = "/media"))
        .UseGiraffe(webApp)

let configureServices (services: IServiceCollection) =
    services.AddHealthChecks() |> ignore
    services.AddCors() |> ignore
    services.AddGiraffe() |> ignore

// This logger is the https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.logging.ilogger?view=dotnet-plat-ext-7.0
let configureLogging (builder: ILoggingBuilder) =
    let filter (l: LogLevel) =
        if DotNetEnv.Env.GetBool("ISDEV") then
            true
        else
            match l with
            | LogLevel.Error -> true
            | LogLevel.Warning -> true
            | LogLevel.Critical -> true
            | _ -> false

    builder.AddFilter(filter).AddConsole().AddDebug() |> ignore

[<EntryPoint>]
let main args =
    let isDevArg = args |> Array.contains "ISDEV"

    Environment.SetEnvironmentVariable("ISDEV", (if isDevArg then "true" else "false"))

    Utils.loadDotEnvFile ()

    printfn "RIDO Server Address: %s" (Utils.apiServerAddress ())

    Jobs.LogPrune.initLogPruneJob ()

    // task {
    //     do! Async.Sleep 2000

    //     // for i in 1..20 do
    //     //     Log.warn
    //     //         { message = Some (sprintf "Hello %d" i)
    //     //           service = None
    //     //           stack = None
    //     //           other = Some({| hello = "derp" |}) }
    //     let adminUpdate = new EventEmitter.AdminSettingsEventEmitter()
    // }
    // |> ignore

    let contentRoot = Directory.GetCurrentDirectory()
    let webRoot = Path.Combine(contentRoot, "WebRoot")

    Host
        .CreateDefaultBuilder(args)
        .ConfigureWebHostDefaults(fun webHostBuilder ->
            webHostBuilder
                .UseContentRoot(contentRoot)
                .UseWebRoot(webRoot)
                .UseUrls(Utils.apiServerAddress ())
                .Configure(Action<IApplicationBuilder> configureApp)
                .ConfigureServices(configureServices)
                .ConfigureLogging(configureLogging)
            |> ignore)
        .Build()
        .Run()

    0
