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

            match initialAdminSettings with
            | Ok _ -> ignore ()
            | Error err ->
                let errorMessage = "Unable to get admin settings data for SSE"

                Log.error
                    { message = Some errorMessage
                      service = Some "api"
                      stack = None
                      other = Some(err.ToString()) }

                failwith errorMessage

            let mutable adminSettings = initialAdminSettings

            // adminSettingsUpdateEventEmitter.AdminSettingsUpdate.Add(fun (updatedAdminSettings) ->
            //     adminSettings = updatedAdminSettings)

            let res = ctx.Response
            ctx.SetStatusCode StatusCodes.Status200OK
            ctx.SetHttpHeader("Content-Type", "text/event-stream")
            ctx.SetHttpHeader("Cache-Control", "no-cache")
            ctx.SetHttpHeader("x-no-compression", "true")
            ctx.SetHttpHeader("Connection", "keep-alive")

            let data = JsonSerializer.Serialize(initialAdminSettings)

            while true do
                do! res.WriteAsync($"event: admin-settings-update\ndata: {data}\n\n")
                do! res.Body.FlushAsync()

                do! Async.Sleep(TimeSpan.FromSeconds 1.)
            // count <- count + 1

            return! text "" next ctx
        }
