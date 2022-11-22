module Log

open System
open Microsoft.Data.Sqlite
open Donald

type LogData<'T> = { message: string option; service: string option; stack: string option; other: 'T option }

type private Log<'T> =
    { createdAt: int64
      level: string
      message: string option
      service: string option
      stack: string option
      other: 'T option }

type private LogPreparedForDB =
    { createdAt: int64; level: string; message: string; service: string; stack: string; other: string }

let private createLogForDB (logData: Log<'T>) =
    { createdAt = logData.createdAt
      level = logData.level
      message = logData.message |> Option.defaultValue "NULL"
      service = logData.service |> Option.defaultValue "NULL"
      stack = logData.stack |> Option.defaultValue "NULL"
      // Dont need to json stringify as not going to json parse on the frontend. Just gonna display it as a string.
      other =
          match logData.other with
          | Some thing -> thing |> string
          | None -> "NULL" }

let private createTimestamp () =
    Convert.ToInt64((DateTime.UtcNow - DateTime(1970, 1, 1, 0, 0, 0)).TotalMilliseconds)

let private logToConsole (log: Log<'T>) =
    let printPreface =
        match log.level with
        | "fatal" -> "⛔"
        | "error" -> "⛔"
        | "warn" -> "⚠️"
        | _ -> ""

    printfn "%s \n %A" printPreface log

let private globalLogLevel = DotNetEnv.Env.GetString("LOGLEVEL", "error")

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

let private log (logLevel: string) (logData: LogData<'T>) =
    if logLevel.ToLower() <> globalLogLevel.ToLower() then
        ()

    let logDataWithLevelAndTimestamp: Log<'T> =
        { createdAt = createTimestamp ()
          level = logLevel
          message = logData.message
          service = logData.service
          stack = logData.stack
          other = logData.other }

    logDataWithLevelAndTimestamp |> createLogForDB |> saveLogToDB

    logToConsole logDataWithLevelAndTimestamp
    ()

let fatal (logData: LogData<'T>) = log "fatal" logData
let error (logData: LogData<'T>) = log "error" logData
let warn (logData: LogData<'T>) = log "warn" logData
let info (logData: LogData<'T>) = log "info" logData
let debug (logData: LogData<'T>) = log "debug" logData
