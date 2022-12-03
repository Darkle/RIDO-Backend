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
