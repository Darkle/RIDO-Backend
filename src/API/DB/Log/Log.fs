module Log

open Microsoft.Data.Sqlite
open Donald

let mutable private db = null

let init (dbConnection: SqliteConnection) =
    db <- dbConnection
    ()

let private saveLogToDB log =
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

    db |> Db.newCommand sql |> Db.setParams sqlParams |> Db.Async.exec
