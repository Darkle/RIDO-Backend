module API.Impl

open API.LogIngestion
open API.Types

// let api: IAPI = { addLog = saveLogToDB }
// let foo log =
//     async {
//         printfn "*************getting here***************"
//         let! dbResult = saveLogToDB log |> Async.Catch
//         printfn "dbResult  %A" dbResult

//         let returnThing =
//             match dbResult with
//             | Choice2Of2 err ->
//                 printfn "DB Error: %A" err
//                 err
//             | _ -> ignore ()

//         return returnThing

//     }
let api: IAPI =
    { addLog =
        fun log ->
            async {
                printfn "log: %A" log
                Validation.validateIncomingLogForDB log
                let! dbResult = saveLogToDB log |> Async.Catch

                // Doing it this way so can log the error to the console server side and also send it to client by re-throwing
                // (Fable.Remoting passes the thrown exception to the client)
                match dbResult with
                | Choice2Of2 err ->
                    printfn "DB Error: %A" err
                    failwith (sprintf "%A" err)
                | _ -> ignore ()
            } }
