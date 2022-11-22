module API.App

open System
open System.IO
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Cors.Infrastructure
open Microsoft.AspNetCore.Hosting
open Microsoft.Extensions.Hosting
open Microsoft.Extensions.Logging
open Microsoft.Extensions.DependencyInjection
open Giraffe
open API.Routes

let webApp =
    choose
        [ routeCix "/bar" >=> text "Bar"
          routeCix "/name-as-query" >=> logquery
          routeCif "/name/%s" logpath

          subRouteCi "/api" (choose [ routeCix "/foo" >=> text "Foo 1"; routeCix "/bar" >=> text "Bar 1" ])

          // If none of the routes matched then return a 404
          setStatusCode 404 >=> text "Not Found" ]

let errorHandler (ex: Exception) (giraffeLogger: ILogger) =
    let errorMessage =
        "An unhandled exception has occurred while executing the request."

    giraffeLogger.LogError(ex, errorMessage)

    clearResponse >=> setStatusCode 500 >=> text ex.Message

let configureCors (builder: CorsPolicyBuilder) =
    builder.WithOrigins("http://localhost:5000").AllowAnyMethod().AllowAnyHeader()
    |> ignore

let configureApp (app: IApplicationBuilder) =
    let env = app.ApplicationServices.GetService<IWebHostEnvironment>()

    (match env.IsDevelopment() with
     | true -> app.UseDeveloperExceptionPage()
     | false -> app.UseGiraffeErrorHandler(errorHandler))
        .UseCors(configureCors)
        .UseStaticFiles()
        .UseGiraffe(webApp)

let configureServices (services: IServiceCollection) =
    services.AddCors() |> ignore
    services.AddGiraffe() |> ignore

let configureLogging (builder: ILoggingBuilder) =
    builder.AddConsole().AddDebug() |> ignore

let loadDotEnvFile (args: string array) =
    let isDev = args |> Array.contains "ISDEV"
    let dotEnvFileToLoad = if isDev then "../../.env.dev" else "../../.env"
    DotNetEnv.Env.Load(dotEnvFileToLoad) |> ignore

[<EntryPoint>]
let main args =
    loadDotEnvFile args

    Log.warn { message = Some "Hello"; service = None; stack = None; other = Some({| hello = "derp" |}) }

    // let contentRoot = Directory.GetCurrentDirectory()
    // let webRoot = Path.Combine(contentRoot, "WebRoot")

    // Host
    //     .CreateDefaultBuilder(args)
    //     .ConfigureWebHostDefaults(fun webHostBuilder ->
    //         webHostBuilder
    //             .UseContentRoot(contentRoot)
    //             .UseWebRoot(webRoot)
    //             .Configure(Action<IApplicationBuilder> configureApp)
    //             .ConfigureServices(configureServices)
    //             .ConfigureLogging(configureLogging)
    //         |> ignore)
    //     .Build()
    //     .Run()

    0
