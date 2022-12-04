module API.AdminSettings

open Donald
open FsToolkit.ErrorHandling
open System.Linq

(*
Updating stuff is akward cause sometimes need to update a record dynamically
*)
// let dummySettings = {}


let adminSettingsTable = table<RIDOTypes.AdminSettings>

let getAdminSettings () =
    taskResult {
        return!
            select {
                for adminSettings in adminSettingsTable do
                    where (adminSettings.uniqueId = "admin-settings")
            }
            |> DB.ridoDB.SelectAsync<RIDOTypes.AdminSettings>
    }
    |> TaskResult.map (fun (adminSettingsIenumerable) -> adminSettingsIenumerable.First())


let updateAdminSetting (settingName: string) settingValue =
    taskResult {
        return!
            update {
                for adminSettings in adminSettingsTable do
                    // setColumn
                    //     (adminSettings
                    //         .GetType()
                    //         .GetProperty(settingName)
                    //         .GetValue(adminSettings, [| settingName |]))
                    //     settingValue
                    adminSettings :?> DynamicDictionary
                    setColumn adminSettings.``settingName`` 20

                    where (adminSettings.uniqueId = "admin-settings")
            }
            |> DB.ridoDB.UpdateAsync
    }
