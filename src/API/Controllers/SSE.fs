module API.SSE

open Giraffe
open Microsoft.AspNetCore.Http
open System.Text.Json
open API.EventEmitter
open API.AdminSettings

//Based on https://gist.github.com/AngelMunoz/01f9bccbf338c1be18470ec684e91898#file-server-sent-events-fs
let sseHandlerAdminSettingsUpdate: HttpHandler =
    fun (next: HttpFunc) (ctx: HttpContext) ->
        task {
            let! initialAdminSettings = getAdminSettings ()

            let mutable shouldPushEvents = true
            let mutable newUpdate = true

            let mutable adminSettings =
                match initialAdminSettings with
                | Ok settings -> settings
                | Error err ->
                    let errorMessage = "Unable to get admin settings data for SSE"

                    Log.error
                        { message = Some errorMessage
                          service = Some "api"
                          stack = None
                          other = Some(err |> string) }

                    failwith errorMessage

            let emitterHandler =
                new Handler<RIDOTypes.AdminSettings>(fun sender updatedAdminSettings ->
                    adminSettings <- updatedAdminSettings
                    newUpdate <- true)

            adminSettingsUpdateEventEmitter.AdminSettingsUpdate.AddHandler(emitterHandler)

            ctx.SetStatusCode StatusCodes.Status200OK
            ctx.SetHttpHeader("Content-Type", "text/event-stream")
            ctx.SetHttpHeader("Cache-Control", "no-cache")
            ctx.SetHttpHeader("x-no-compression", "true")
            ctx.SetHttpHeader("Connection", "keep-alive")

            ctx.RequestAborted.Register(fun _ -> shouldPushEvents <- false) |> ignore

            while shouldPushEvents do
                if newUpdate then
                    let data = JsonSerializer.Serialize<RIDOTypes.AdminSettings>(adminSettings)
                    newUpdate <- false
                    do! ctx.Response.WriteAsync($"event: admin-settings-update\ndata: {data}\n\n")
                    do! ctx.Response.Body.FlushAsync()

            adminSettingsUpdateEventEmitter.AdminSettingsUpdate.RemoveHandler(emitterHandler)

            return Some ctx
        }
