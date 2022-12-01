module API.Validation

open FsToolkit.ErrorHandling
open API.DBLogType

(*
    Fable.Remoting should take care of checking types, we just need to check
    for any missing properties and that properties conform to what we want
    (eg level has to be on of thise strings)
*)

exception ApiValidationException of string

let propExists (propName: string) (log: LogPreparedForDB) =
    match log.GetType().GetProperty(propName) <> null with
    | true -> Ok true
    | false -> Error(sprintf "Prop %s is missing." propName)

let propsExist (props: string list) (log: LogPreparedForDB) =
    let result = props |> List.traverseResultM (fun propName -> propExists propName log)

    match result with
    | Ok _ -> Ok true
    | Error err -> Error err

let stringIsOneOf (s: string) (strings: string list) =
    match strings |> List.contains s with
    | true -> Ok true
    | false -> Error(sprintf "String %s is not one of %A" s strings)

let validateIncomingLogForDB (log: LogPreparedForDB) =

    let check1 =
        propsExist [ "createdAt"; "level"; "message"; "other"; "service"; "stack" ] log

    let check2 =
        stringIsOneOf log.level [ "fatal"; "error"; "warn"; "info"; "debug"; "trace" ]

    let validationResults = [ check1; check2 ] |> List.sequenceResultA

    if validationResults |> Result.isError then
        let error =
            match validationResults with
            | Error err -> err[0]
            | Ok _ -> null

        let errorMessage = sprintf "Validation error in dbLogValidator: %A" error

        printfn "%A" errorMessage

        raise (ApiValidationException(errorMessage))

    ()
