module API.Impl

open Giraffe
open Giraffe.EndpointRouting
open Microsoft.AspNetCore.Http
open Log

[<CLIMutable>]
type IncomingLog = LogPreparedForDB

let saveLogToDB: HttpHandler =
    fun (next: HttpFunc) (ctx: HttpContext) ->
        task {
            let! log = ctx.BindJsonAsync<IncomingLog>()

            // Doing it this way cause of https://github.com/pimbrouwers/Donald/issues/49
            try
                let! _ = LogIngestion.saveLogToDB log
                return! text "OK" next ctx
            with err ->
                ctx.SetStatusCode StatusCodes.Status500InternalServerError
                return! text (err.ToString()) next ctx
        }
