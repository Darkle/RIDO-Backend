module API.EventEmitter

open RIDOTypes

type AdminSettingsEventEmitter() =
    let adminSettingsUpdate = new Event<AdminSettings>()

    [<CLIEvent>]
    member this.AdminSettingsUpdate = adminSettingsUpdate.Publish

    member this.Trigger(updatedAdminSettings: AdminSettings) =
        adminSettingsUpdate.Trigger(updatedAdminSettings)

(*
USE:    
let adminSettingsUpdateEE = new EventEmitter.AdminSettingsEventEmitter()

adminSettingsUpdateEE.AdminSettingsUpdate.Add(fun (updatedAdminSettings) ->
    printfn "AdminSettings changed! New AdminSettings: %A" updatedAdminSettings)

// So i guess on change of a settings, after saved changes to db, query db and get all admin settings and send through in the .Trigger
adminSettingsUpdateEE.Trigger(
    { uniqueId = "admin-settings"
        numberMediaDownloadsAtOnce = 21
        numberImagesProcessAtOnce = 1
        updateAllDay = true
        updateStartingHour = 1
        updateEndingHour = 23
        imageCompressionQuality = 80
        archiveImageCompressionQuality = 80
        maxImageWidthForNonArchiveImage = 1200 }
)    
*)
