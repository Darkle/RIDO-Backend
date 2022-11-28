module API.Validation

open FsToolkit.ErrorHandling
open API.DBLogType

(*
    As well as being good practice, another reason we are doing runtime validation of the
    data coming in to the api is that Giraffe doesnt guarantee that the JSON it serializes
    will have each property we expect.
*)

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

let propIsOfType (propName: string) (t: 'T) (log: LogPreparedForDB) =
    let propType = log.GetType().GetProperty(propName).GetType()

    match propType = typeof<'T> with
    | true -> Ok true
    | false -> Error(sprintf "Prop %s is not of type %A" propName t)

let propsAreAllOfType (props: string list) (t: 'T) (log: LogPreparedForDB) =
    let result =
        props |> List.traverseResultM (fun propName -> propIsOfType propName t log)

    match result with
    | Ok _ -> Ok true
    | Error err -> Error err

let dbLogValidator (log: LogPreparedForDB) =
    let check1 =
        propsExist [ "createdAt"; "level"; "message"; "other"; "service"; "stack" ] log

    let check2 =
        stringIsOneOf log.level [ "fatal"; "error"; "warn"; "info"; "debug"; "trace" ]

    let check3 = propIsOfType "createdAt" int log

    let check4 =
        propsAreAllOfType [ "level"; "message"; "other"; "service"; "stack" ] string log

    let validationResults = [ check1; check2; check3; check4 ] |> List.sequenceResultA

    (match validationResults with
     | Ok _ -> ignore
     | Error errors -> failwith (sprintf "Validation error in dbLogValidator: %A" errors))
    |> ignore

    ()
