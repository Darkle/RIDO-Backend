namespace Jobs

open FluentScheduler
open API

module LogPrune =
    let private pruneLogs () =
        task {
            let! dbResult = Logs.pruneOldLogs () |> Async.AwaitTask

            match dbResult with
            | Ok _ -> ignore ()
            | Error err ->
                Log.error
                    { message = Some "DB Error pruning logs"
                      service = Some "api"
                      stack = None
                      other = Some(err |> string) }
        }
        |> ignore

    let initLogPruneJob () =
        JobManager.Initialize()

        JobManager.add_JobException (fun info ->
            Log.error
                { message = Some """Error occured in api service "prune logs" job"""
                  service = Some "api"
                  stack = Some(info.Exception |> string)
                  other = None }

        )

        JobManager.AddJob(pruneLogs, (fun (s: Schedule) -> s.ToRunEvery(3).Hours() |> ignore))
