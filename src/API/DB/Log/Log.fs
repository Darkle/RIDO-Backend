module Log

open System.Data
open Donald

type LogLevels =
    | Fatal
    | Error
    | Warn
    | Info
    | Debug

type Log<'T> =
    { createdAt: int
      level: LogLevels
      message: string option
      service: string option
      stack: string option
      other: 'T option }

type LogPreparedForDB =
    { createdAt: int; level: string; message: string; service: string; stack: string; other: string }

let createLog (logData: Log<'T>) : LogPreparedForDB =
    let logLevel =
        match logData.level with
        | Fatal -> "fatal"
        | Error -> "error"
        | Warn -> "warn"
        | Info -> "info"
        | Debug -> "debug"

    { createdAt = logData.createdAt
      level = logLevel
      message = logData.message |> Option.defaultValue "NULL"
      service = logData.service |> Option.defaultValue "NULL"
      stack = logData.stack |> Option.defaultValue "NULL"
      // TODO: convert .other for db with JSON.stringify.
      other = logData.other |> Option.defaultValue "NULL" }

let ofDataReader (reader: IDataReader) : Log<string> =
    let level =
        match reader.ReadString "level" with
        | "fatal" -> Fatal
        | "error" -> Error
        | "warn" -> Warn
        | "info" -> Info
        | "debug" -> Debug
        | _ -> Error

    { createdAt = reader.ReadInt32 "createdAt"
      level = level
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
