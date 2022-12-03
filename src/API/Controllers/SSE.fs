module API.SSE

open Giraffe
open System
open Microsoft.AspNetCore.Http
open System.Text.Json
open API.EventEmitter
open API.AdminSettings

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

            adminSettingsUpdateEventEmitter.AdminSettingsUpdate.Add(fun (updatedAdminSettings) ->
                adminSettings <- updatedAdminSettings
                newUpdate <- true
                ())

            ctx.SetStatusCode StatusCodes.Status200OK
            ctx.SetHttpHeader("Content-Type", "text/event-stream")
            ctx.SetHttpHeader("Cache-Control", "no-cache")
            ctx.SetHttpHeader("x-no-compression", "true")
            ctx.SetHttpHeader("Connection", "keep-alive")

            let data = JsonSerializer.Serialize<RIDOTypes.AdminSettings>(adminSettings)

            while shouldPushEvents do
                if newUpdate then
                    do! ctx.Response.WriteAsync($"event: admin-settings-update\ndata: {data}\n\n")
                    do! ctx.Response.Body.FlushAsync()

                newUpdate <- false

                if ctx.RequestAborted.IsCancellationRequested then
                    shouldPushEvents <- false

            return Some ctx
        }
