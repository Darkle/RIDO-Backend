module Log

open System
open System.Data
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

let private createLogForDB (logData: Log<'T>) : LogPreparedForDB =
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

let private logToConsole (log:Log<'T>) =
    let printPreface = match log.level with
                        | "fatal" -> "⛔"
                        | "error" -> "⛔"
                        | "warn" -> "⚠️"
                        | _ -> ""
    printfn "%s \n %A" printPreface log

let private log (logLevel: string) (logData: LogData<'T>) =
    let logDataWithLevelAndTimestamp: Log<'T> =
        { createdAt = createTimestamp ()
          level = logLevel
          message = logData.message
          service = logData.service
          stack = logData.stack
          other = logData.other }

    let dbLog = createLogForDB logDataWithLevelAndTimestamp
    // TODO: Log to db

    logToConsole logDataWithLevelAndTimestamp
    ()

let fatal (logData: LogData<'T>) = log "fatal" logData
let error (logData: LogData<'T>) = log "error" logData
let warn (logData: LogData<'T>) = log "warn" logData
let info (logData: LogData<'T>) = log "info" logData

let debug (logData: LogData<'T>) = log "debug" logData

// NOTE: not sure if setting ofDataReader to be private causes issues with Donald ORM
let private ofDataReader (reader: IDataReader) : Log<string> =
    { createdAt = reader.ReadInt32 "createdAt"
      level = reader.ReadString "level"
      message = reader.ReadStringOption "message"
      service = reader.ReadStringOption "service"
      stack = reader.ReadStringOption "stack"
      other = reader.ReadStringOption "other" }

// let logs: Result<Log list, DbError> =
//     let sql =
//         "
//         SELECT  full_name
//         FROM    author
//         WHERE   author_id = @author_id"

//     let param = [ "author_id", SqlType.Int 1 ]

//     conn |> Db.newCommand sql |> Db.setParams param |> Db.query ofDataReader
