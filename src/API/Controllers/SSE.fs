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
                adminSettings <- updatedAdminSettings)

            ctx.SetStatusCode StatusCodes.Status200OK
            ctx.SetHttpHeader("Content-Type", "text/event-stream")
            ctx.SetHttpHeader("Cache-Control", "no-cache")
            ctx.SetHttpHeader("x-no-compression", "true")
            ctx.SetHttpHeader("Connection", "keep-alive")

            // For some reason this needs to be an anonymous record
            let data =
                JsonSerializer.Serialize(
                    {| uniqueId = adminSettings.uniqueId
                       numberMediaDownloadsAtOnce = adminSettings.numberMediaDownloadsAtOnce
                       numberImagesProcessAtOnce = adminSettings.numberImagesProcessAtOnce
                       updateAllDay = adminSettings.updateAllDay
                       updateStartingHour = adminSettings.updateStartingHour
                       updateEndingHour = adminSettings.updateEndingHour
                       imageCompressionQuality = adminSettings.imageCompressionQuality
                       archiveImageCompressionQuality = adminSettings.archiveImageCompressionQuality
                       maxImageWidthForNonArchiveImage = adminSettings.maxImageWidthForNonArchiveImage
                       hasSeenWelcomeMessage = adminSettings.hasSeenWelcomeMessage |}
                )

            while shouldPushEvents do
                do! ctx.Response.WriteAsync($"event: admin-settings-update\ndata: {data}\n\n")
                do! ctx.Response.Body.FlushAsync()

                if ctx.RequestAborted.IsCancellationRequested then
                    shouldPushEvents <- false

            return! text "" next ctx
        }
