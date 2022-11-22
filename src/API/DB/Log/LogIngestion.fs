module API.LogIngestion

open Donald

let saveLogToDB (log: Log.LogPreparedForDB) =
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

    DB.logsDB |> Db.newCommand sql |> Db.setParams sqlParams |> Db.Async.exec
