module API.Routes

open Giraffe
open Microsoft.AspNetCore.Http
open Serilog

type AdditionalData = { Name: string }

let logquery: HttpHandler =
    fun (next: HttpFunc) (ctx: HttpContext) ->
        let time = 4

        Log.Information("Processed in {TimeMS:000} ms.", time)

        let name = ctx.TryGetQueryStringValue "name" |> Option.defaultValue "Giraffe"
        let greeting = sprintf "Hello World, from %s" name
        text greeting next ctx

let logpath (path: string) =
    let thing = sprintf "Hello %s" path
    text thing
