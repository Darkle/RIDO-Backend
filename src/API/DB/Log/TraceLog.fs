module TraceLog

open System.Data
open Donald
open API.DB

type TraceLogLevel = | Trace

type TraceLog =
    { createdAt: int
      level: TraceLogLevel
      message: string option
      service: string option
      stack: string option
      other: string option }

type TraceLogReadyForDB =
    { createdAt: int
      level: string
      message: string option
      service: string option
      stack: string option
      other: string option }

let createLog (logData: TraceLog) : TraceLogReadyForDB =
    // TODO: convert Some/None for db. Also JSON.stringify the other
    { createdAt = logData.createdAt
      level = "trace"
      message = logData.message
      service = logData.service
      stack = logData.stack
      other = logData.other }

// let ofDataReader (reader: IDataReader) : TraceLogReadyForDB =
//     { createdAt = reader.ReadInt32 "createdAt"
//       level = reader.ReadString "level"
//       message = reader.ReadStringOption "message"
//       service = reader.ReadStringOption "service"
//       stack = reader.ReadStringOption "stack"
//       other = reader.ReadStringOption "other" }

// let logs: Result<TraceLog list, DbError> =
//     let sql =
//         "
//         SELECT  full_name
//         FROM    author
//         WHERE   author_id = @author_id"

//     let param = [ "author_id", SqlType.Int 1 ]

//     conn |> Db.newCommand sql |> Db.setParams param |> Db.query ofDataReader
