module Log

open System
open FsToolkit.ErrorHandling
open RPC.Client
open API.LogType

type LogLevelAsNumber =
    | Fatal = 0
    | Error = 1
    | Warn = 2
    | Info = 3
    | Debug = 4
    | Trace = 4

type LogData<'T> =
    { message: string option; service: string option; stack: string option; other: 'T option }

type Log<'T> =
    { createdAt: int64
      level: string
      message: string option
      service: string option
      stack: string option
      other: 'T option }

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

let private logToConsole (log: Log<'T>) =
    let preface =
        match log.level with
        | "fatal" -> "⛔"
        | "error" -> "⛔"
        | "warn" -> "⚠️"
        | _ -> ""

    printfn "%s \n %A" preface log

let private sendLogToDB log =
    // asyncResult {
    //     let! apiResult = apiClient.addLog log |> AsyncResult.catch

    //     match apiResult with
    //     | Ok _ -> ignore ()
    //     | Error err -> printfn "An error occured with apiClient: %A" err
    // }
    // |> Async.Ignore
    // |> ignore
    printfn "sendLogToDB "

    async {
        printfn "sendLogToDB async 1"
        let! apiResult = apiClient.addLog log |> Async.Catch

        printfn "sendLogToDB async 2"

        match apiResult with
        | Choice1Of2 _ -> ignore ()
        | Choice2Of2 err -> printfn "An error occured with apiClient: %A" err
    }
    |> Async.Start

let private convertStringLogLevelToNum (logLevel: string) =
    match logLevel.ToLower() with
    | "fatal" -> LogLevelAsNumber.Fatal
    | "error" -> LogLevelAsNumber.Error
    | "warn" -> LogLevelAsNumber.Warn
    | "info" -> LogLevelAsNumber.Info
    | "debug" -> LogLevelAsNumber.Debug
    | "trace" -> LogLevelAsNumber.Trace
    | _ -> LogLevelAsNumber.Error

let private globalLogLevelAsNum =
    DotNetEnv.Env.GetString("LOGLEVEL", "error") |> convertStringLogLevelToNum

let private logLevelIsNotHighEnough (logLevel: string) =
    let logLevelAsNum = convertStringLogLevelToNum logLevel
    logLevelAsNum > globalLogLevelAsNum

let private isTraceLog (logLevel: string) = logLevel.ToLower() = "trace"

let private log (logLevel: string) (logData: LogData<'T>) =
    // Always allow trace logs through to be saved to db
    if not (isTraceLog logLevel) && logLevelIsNotHighEnough logLevel then
        ()

    let logDataWithLevelAndTimestamp: Log<'T> =
        { createdAt = createTimestamp ()
          level = logLevel
          message = logData.message
          service = logData.service
          stack = logData.stack
          other = logData.other }

    logDataWithLevelAndTimestamp |> createLogForDB |> sendLogToDB

    // Dont wanna log trace logs to console; too noisy.
    if not (isTraceLog logLevel) then
        logToConsole logDataWithLevelAndTimestamp

    ()

let fatal (logData: LogData<'T>) = log "fatal" logData
let error (logData: LogData<'T>) = log "error" logData
let warn (logData: LogData<'T>) = log "warn" logData
let info (logData: LogData<'T>) = log "info" logData
let debug (logData: LogData<'T>) = log "debug" logData
let trace (logData: LogData<'T>) = log "trace" logData
