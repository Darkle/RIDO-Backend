module API.LogIngestion

open Donald

let saveLogToDB (log: Log.LogPreparedForDB) =
    let sql =
        "
    INSERT INTO Logasd (createdAt, level, message, service, stack, other)
    VALUES (@createdAt, @level, @message, @service, @stack, @other);"

    let sqlParams =
        [ ("createdAt", SqlType.Int64 log.createdAt)
          ("level", SqlType.String log.level)
          ("message", SqlType.String log.message)
          ("service", SqlType.String log.service)
          ("stack", SqlType.String log.stack)
          ("other", SqlType.String log.other) ]

    let sqlToExec = DB.logsDB |> Db.newCommand sql |> Db.setParams sqlParams

    async {
        let! dbResult = Db.Async.exec sqlToExec |> Async.AwaitTask |> Async.Catch

        match dbResult with
        | Choice2Of2 err -> printfn "DB Error: %A" err
        | _ -> ignore ()
    }
    |> Async.Start

    // task {
    //     try
    //         let! _ = Db.Async.exec sqlToExec
    //         ()
    //     with err ->
    //         printfn "DB Error: %A" err
    // }
    // |> ignore

    ()
