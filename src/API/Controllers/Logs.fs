module API.Logs

// open Donald
open Dapper.FSharp.SQLite
open RIDOTypes
open FsToolkit.ErrorHandling
open System.Threading.Tasks

let logsTable = table<LogPreparedForDB>

let saveLogToDB (log: LogPreparedForDB) =
    taskResult {
        return!
            insert {
                into logsTable
                value log
            }
            |> DB.logsDB.InsertAsync
    }

let private fiveDaysAgoUnixTime () =
    let fiveDaysInMs = 432_000_000
    Utils.createUnixTimestamp () - (fiveDaysInMs |> int64)

let pruneOldLogs () =
    taskResult {
        return!
            delete {
                for log in logsTable do
                    where (log.createdAt < fiveDaysAgoUnixTime ())
            }
            |> DB.logsDB.DeleteAsync
    }
// let sql =
//     "
// INSERT INTO Log (createdAt, level, message, service, stack, other)
// VALUES (@createdAt, @level, @message, @service, @stack, @other);"

// let sqlParams =
//     [ ("createdAt", SqlType.Int64 log.createdAt)
//       ("level", SqlType.String log.level)
//       ("message", SqlType.String log.message)
//       ("service", SqlType.String log.service)
//       ("stack", SqlType.String log.stack)
//       ("other", SqlType.String log.other) ]

// DB.logsDB
// |> Db.newCommand sql
// |> Db.setParams sqlParams
// |> Db.Async.exec
// |> Async.AwaitTask

// async {
//     let! dbResult = Db.Async.exec sqlToExec |> Async.AwaitTask |> Async.Catch

//     match dbResult with
//     | Choice2Of2 err -> printfn "DB Error: %A" err
//     | _ -> ignore ()
// }

// task {
//     try
//         let! dbResult = Db.Async.exec sqlToExec
//         printfn "dbResult.GetType: %A" (dbResult.GetType())
//         printfn "dbResult %A" dbResult
//         ()
//     with err ->
//         printfn "err.GetType: %A" (err.GetType())
//         printfn "DB Error: %A" err
// }
// |> ignore
