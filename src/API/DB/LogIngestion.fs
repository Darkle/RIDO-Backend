module API.LogIngestion

open Donald
open API.DBLogType

let saveLogToDB (log: LogPreparedForDB) =
    let sql =
        "
    INSERT INTO Log (createdAt, level, message, service, stack, other)
    VALUES (@createdAt, @level, @message, @service, @stack, @other);"

    let sqlParams =
        [ ("createdAt", SqlType.Int64 log.createdAt)
          ("level", SqlType.String log.level)
          ("message", SqlType.String log.message)
          ("service", SqlType.String log.service)
          ("stack", SqlType.String log.stack)
          ("other", SqlType.String log.other) ]

    DB.logsDB
    |> Db.newCommand sql
    |> Db.setParams sqlParams
    |> Db.Async.exec
    |> Async.AwaitTask
// |> Async.Catch

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
