module Downloads.Entry

open System
open FluentScheduler
open EvtSource
open System.Text.Json

[<EntryPoint>]
let main args =
    let isDevArg = args |> Array.contains "ISDEV"

    Environment.SetEnvironmentVariable("ISDEV", (if isDevArg then "true" else "false"))

    Utils.loadDotEnvFile ()

    JobManager.Initialize()

    JobManager.add_JobException (fun info ->
        Log.error
            { message = Some "Error occured in Downloads service jobs"
              service = Some "Download"
              stack = Some(info.Exception |> string)
              other = None }

    )

    JobManager.AddJob((fun _ -> printfn "3 seconds passed"), (fun s -> s.ToRunEvery(3).Seconds() |> ignore))

    let evt =
        new EventSourceReader(new Uri(Utils.getApiServerAddress () + "/sse/admin-settings-update"))

    evt.MessageReceived.Add(fun e ->
        printfn "event: %s data: %A" e.Event (JsonSerializer.Deserialize<RIDOTypes.AdminSettings>(e.Message)))

    evt.Start() |> ignore

    // Do it this way as opposed to a while loop so it runs on a background thread.
    let rec loop () = async { return! loop () }

    loop () |> Async.RunSynchronously

    0
