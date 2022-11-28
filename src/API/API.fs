module API.Impl

open API.LogIngestion
open API.Types

// let api: IAPI = { addLog = saveLogToDB }
let api: IAPI =
    { addLog =
        fun log ->
            async {
                printfn "*************getting here***************"
                let! dbResult = saveLogToDB log |> Async.Catch
                printfn "dbResult  %A" dbResult
                match dbResult with
                | Choice2Of2 err -> printfn "DB Error: %A" err
                | _ -> ignore ()
            } }
