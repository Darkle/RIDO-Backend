module API.Impl

open API.Logs
open RIDOTypes

let api: IAPI =
    { addLog =
        fun log ->
            async {
                Validation.validateIncomingLogForDB log

                let! dbResult = saveLogToDB log |> Async.AwaitTask

                // Doing it this way so can log the error to the console server side and also send it to client by re-throwing
                match dbResult with
                | Error err ->
                    printfn "DB Error: %A" err
                    failwith (sprintf "%A" err)
                | Ok _ -> ignore ()
            } }
