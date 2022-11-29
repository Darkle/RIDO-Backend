module API.Validation

open System
open FsToolkit.ErrorHandling
open API.DBLogType

(*
    As well as being good practice, another reason we are doing runtime validation of the
    data coming in to the api is that Giraffe doesnt guarantee that the JSON it serializes
    will have each property we expect.
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

let propIsOfType (propName: string) (t: Type) (log: LogPreparedForDB) =
    // When doing JSON serialization (via newtonsoft json), Fable.Remoting converts int32 to int64
    let typeToCheckFor = if t = typeof<Int32> then typeof<Int64> else t
    let propType = log.GetType().GetProperty(propName).PropertyType

    match propType = typeToCheckFor with
    | true -> Ok true
    | false -> Error(sprintf "Prop %s is not of type %A" propName t)

let propsAreAllOfType (props: string list) (t: 'T) (log: LogPreparedForDB) =
    let result =
        props |> List.traverseResultM (fun propName -> propIsOfType propName t log)

    match result with
    | Ok _ -> Ok true
    | Error err -> Error err

let validateIncomingLogForDB (log: LogPreparedForDB) =
    printfn "here 1"

    let check1 =
        propsExist [ "createdAt"; "level"; "message"; "other"; "service"; "stack" ] log

    printfn "here 2"

    let check2 =
        stringIsOneOf log.level [ "fatal"; "error"; "warn"; "info"; "debug"; "trace" ]

    printfn "here 3"

    let check3 = propIsOfType "createdAt" typeof<int> log
    printfn "here 4"

    let check4 =
        propsAreAllOfType [ "level"; "message"; "other"; "service"; "stack" ] typeof<string> log

    printfn "here 5"

    let validationResults = [ check1; check2; check3; check4 ] |> List.sequenceResultA
    // let validationResults = [ check1; check2; check3 ] |> List.sequenceResultA
    printfn "here 6"

    if validationResults |> Result.isError then
        printfn "here 7"

        let error =
            match validationResults with
            | Error err -> err[0]
            | Ok _ -> null

        let errorMessage = sprintf "Validation error in dbLogValidator: %A" error

        printfn "%A" errorMessage

        raise (ApiValidationException(errorMessage))

    ()
