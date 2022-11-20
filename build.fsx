#!/usr/bin/env -S dotnet fsi
// the hash bang here allows us to run the build script without invoking dotnet manually
// The ‘-S’ option instructs ‘env’ to split the single string into multiple arguments

// It is recommended to specify a version
#r "nuget: FsMake, 0.6.1"
#r "nuget: DotNetEnv, 2.3.0"

open System.IO
open FsMake

// To import from another fsx/fs script
// #load "build-foo.fsx"
// Assuming `foo` is the thing that "build-foo.fsx" exports, dont forget to open it:
// open foo
// You should now have access to stuff in the foo module in this script


// Skip the first 2 args as they are just a .dll thing and the file name.
let args = System.Environment.GetCommandLineArgs()[2..]

let loggingDBPath = DotNetEnv.Env.GetString("LOGGINGDBPATH", "./logging.db")



let loggingDbInitSQLFilePath = Path.Combine("src", "API", "DB", "init-db.sql")
let loggingDBReadString = sprintf ".read %s" loggingDbInitSQLFilePath

let dev =
    Step.create "dev" {
        // Init the dbs
        do! Cmd.createWithArgs "sqlite3" [ loggingDBPath; loggingDBReadString ] |> Cmd.run
        // Commands that return an exit code other than 0 fail the step by default.
        // This can be controlled with [Cmd.exitCodeCheck].
        do!
            Cmd.createWithArgs "dotnet" [ "run"; "--project"; "src/API/API.fsproj" ]
            |> Cmd.run

    //https://github.com/seanamos/FsMake/blob/master/build.fsx - examples
    }

let devWatch =
    Step.create "dev-watch" {
        // Init the dbs
        do! Cmd.createWithArgs "sqlite3" [ loggingDBPath; loggingDBReadString ] |> Cmd.run

        // do!
        //     Cmd.createWithArgs "dotnet" [ "watch"; "run"; "--project"; "src/API/API.fsproj" ]
        //     |> Cmd.run

    //https://github.com/seanamos/FsMake/blob/master/build.fsx - examples
    }

let audit =
    Step.create "audit" {
        // Commands that return an exit code other than 0 fail the step by default.
        // This can be controlled with [Cmd.exitCodeCheck].
        do!
            Cmd.createWithArgs "dotnet" [ "list"; "src/API/API.fsproj"; "package"; "--vulnerable" ]
            |> Cmd.run

    //https://github.com/seanamos/FsMake/blob/master/build.fsx - examples
    }

let outdated =
    Step.create "outdated" {
        // Commands that return an exit code other than 0 fail the step by default.
        // This can be controlled with [Cmd.exitCodeCheck].
        do!
            Cmd.createWithArgs "dotnet" [ "list"; "src/API/API.fsproj"; "package"; "--outdated" ]
            |> Cmd.run

    //https://github.com/seanamos/FsMake/blob/master/build.fsx - examples
    }

let lint =
    Step.create "lint" {
        do!
            Cmd.createWithArgs "dotnet" [ "fsharplint"; "lint"; "src/API/API.fsproj" ]
            |> Cmd.run

    // do!
    //     Cmd.createWithArgs "dotnet" [ "fsharplint"; "lint"; "src/Thing/Thing.fsproj" ]
    //     |> Cmd.run
    }

// Define your pipelines, for now we just want a simple "build" pipeline.
// You can define pipelines with parallel/conditional steps.
// You can also define pipelines from other pipelines.
Pipelines.create {
    let! defaultPipeline = Pipeline.create "default" { run dev }
    do! Pipeline.create "dev-watch" { run devWatch }
    do! Pipeline.create "lint" { run lint }
    do! Pipeline.create "dev" { run dev }
    do! Pipeline.create "outdated" { run outdated }
    do! Pipeline.create "audit" { run audit }

    default_pipeline defaultPipeline
}
|> Pipelines.runWithArgsAndExit args