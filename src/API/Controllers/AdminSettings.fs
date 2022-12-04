module API.AdminSettings

open Dapper.FSharp.SQLite
open FsToolkit.ErrorHandling
open System.Linq

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

// TODO: try to type function params. Also see if better way to dynamically access record key
// https://github.com/Dzoukr/Dapper.FSharp/issues/25
let updateAdminSetting (settingName: string) settingValue =
    taskResult {
        let sql = "UPDATE AdminSettings SET @col = @val WHERE uniqueId = @key"
        let pars = [("col", box column); ("val", box value); ("key", box key)]
        DB.ridoDB.ExecuteAsync(sql, pars)
        // return!
        //     update {
        //         for adminSettings in adminSettingsTable do
        //             // setColumn
        //             //     (adminSettings
        //             //         .GetType()
        //             //         .GetProperty(settingName)
        //             //         .GetValue(adminSettings, [| settingName |]))
        //             //     settingValue
        //             adminSettings :?> DynamicDictionary
        //             setColumn adminSettings.``settingName`` 20

        //             where (adminSettings.uniqueId = "admin-settings")
        //     }
        //     |> DB.ridoDB.UpdateAsync
    }
