module API.AdminSettings

open Dapper.FSharp.SQLite
open Dapper
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

// https://github.com/Dzoukr/Dapper.FSharp/issues/25
let updateAdminSetting (settingName) settingValue =
    taskResult {
        let sql = @"UPDATE AdminSettings SET @col = 20 WHERE uniqueId = 'admin-settings'"
        let pars = [ ("col", box settingName); ("val", box settingValue) ]

        return! DB.ridoDB.ExecuteAsync(sql, pars)
    }
