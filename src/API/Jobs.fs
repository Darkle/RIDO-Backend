namespace Jobs

open FluentScheduler
open Donald
open API

module LogPrune =
    let private fiveDaysAgoUnixTime () =
        let fiveDaysInMs = 432_000_000
        Utils.createUnixTimestamp () - (fiveDaysInMs |> int64)

    let private pruneLogs () =
        let sql = "DELETE FROM Log WHERE createdAt < @fiveDaysAgoInMs"

        let sqlParam = [ ("fiveDaysAgoInMs", SqlType.Int64(fiveDaysAgoUnixTime ())) ]

        task {
            try
                let! _ = DB.logsDB |> Db.newCommand sql |> Db.setParams sqlParam |> Db.Async.exec
                ()
            with err ->
                Log.error
                    { message = Some "DB Error pruning logs"
                      service = Some "api"
                      stack = Some err.StackTrace
                      other = Some err.Message }
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
