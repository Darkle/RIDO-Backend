module Log

open System.Data
open Donald
open API.DB

type LogLevels =
    | Fatal
    | Error
    | Warn
    | Info
    | Debug

type Log =
    { createdAt: int
      level: LogLevels
      message: string option
      service: string option
      stack: string option
      other: string option }

type DBLog =
    { createdAt: int
      level: string
      message: string option
      service: string option
      stack: string option
      other: string option }

let createLog (logData: Log) : DBLog =
    let logLevel =
        match logData.level with
        | Fatal -> "fatal"
        | Error -> "error"
        | Warn -> "warn"
        | Info -> "info"
        | Debug -> "debug"
    // TODO: convert Some/None to null/string for db with JSON.stringify. Also JSON.stringify the .other. ACTUALLY, i think in only need to do that for .other as wont the ORM convert Some string to a string and None to null?
    { createdAt = logData.createdAt
      level = logLevel
      message = logData.message
      service = logData.service
      stack = logData.stack
      other = logData.other }

// let ofDataReader (reader: IDataReader) : LogReadyForDB =
//     { createdAt = reader.ReadInt32 "createdAt"
//       level = reader.ReadString "level"
//       message = reader.ReadStringOption "message"
//       service = reader.ReadStringOption "service"
//       stack = reader.ReadStringOption "stack"
//       other = reader.ReadStringOption "other" }

// let logs: Result<Log list, DbError> =
//     let sql =
//         "
//         SELECT  full_name
//         FROM    author
//         WHERE   author_id = @author_id"

//     let param = [ "author_id", SqlType.Int 1 ]

//     conn |> Db.newCommand sql |> Db.setParams param |> Db.query ofDataReader
