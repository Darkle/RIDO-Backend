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

let loadEnvFile (isDev: bool) =
    DotNetEnv.Env.Load(if isDev then "./.env.dev" else "./.env") |> ignore

let dataDirectory = DotNetEnv.Env.GetString("DATA_FOLDER", "./data")

let mediaDirectory =
    DotNetEnv.Env.GetString("MEDIA_DOWNLOADS_FOLDER", "./media-downloads")

let loggingDBPath = dataDirectory + "/logging.db"

let loggingDbInitSQLFilePath =
    Path.Join("src", "API", "DB", "init-scripts", "init-logging-db.sql")

let ridoDBPath = dataDirectory + "/RIDO.db"

let ridoDbInitSQLFilePath =
    Path.Join("src", "API", "DB", "init-scripts", "init-rido-db.sql")

let sqliteReadString dbSqlFilePath = sprintf ".read %s" dbSqlFilePath

let createDirs () =
    Directory.CreateDirectory dataDirectory |> ignore
    Directory.CreateDirectory mediaDirectory |> ignore
    ()

let devApi =
    Step.create "dev-api" {
        loadEnvFile true

        createDirs ()

        // Init the DBs
        do!
            Cmd.createWithArgs "sqlite3" [ loggingDBPath; sqliteReadString loggingDbInitSQLFilePath ]
            |> Cmd.run

        do!
            Cmd.createWithArgs "sqlite3" [ ridoDBPath; sqliteReadString ridoDbInitSQLFilePath ]
            |> Cmd.run

        // Commands that return an exit code other than 0 fail the step by default.
        // This can be controlled with [Cmd.exitCodeCheck].
        do!
            Cmd.createWithArgs "dotnet" [ "run"; "--project"; "src/API/API.fsproj"; "--"; "ISDEV" ]
            |> Cmd.run

    //https://github.com/seanamos/FsMake/blob/master/build.fsx - examples
    }

let devWatchApi =
    Step.create "dev-watch-api" {
        loadEnvFile true

        createDirs ()

        // Init the DBs
        do!
            Cmd.createWithArgs "sqlite3" [ loggingDBPath; sqliteReadString loggingDbInitSQLFilePath ]
            |> Cmd.run

        do!
            Cmd.createWithArgs "sqlite3" [ ridoDBPath; sqliteReadString ridoDbInitSQLFilePath ]
            |> Cmd.run

        do!
            Cmd.createWithArgs "dotnet" [ "watch"; "run"; "--project"; "src/API/API.fsproj"; "--"; "ISDEV" ]
            |> Cmd.run

    //https://github.com/seanamos/FsMake/blob/master/build.fsx - examples
    }

let devDownloads =
    Step.create "dev-downloads" {
        loadEnvFile true

        do!
            Cmd.createWithArgs "dotnet" [ "run"; "--project"; "src/Downloads/Downloads.fsproj"; "--"; "ISDEV" ]
            |> Cmd.run

    //https://github.com/seanamos/FsMake/blob/master/build.fsx - examples
    }

let devWatchDownloads =
    Step.create "dev-watch-downloads" {
        loadEnvFile true

        do!
            Cmd.createWithArgs "dotnet" [ "watch"; "run"; "--project"; "src/Downloads/Downloads.fsproj"; "--"; "ISDEV" ]
            |> Cmd.run

    //https://github.com/seanamos/FsMake/blob/master/build.fsx - examples
    }

let audit =
    Step.create "audit" {
        // Commands that return an exit code other than 0 fail the step by default.
        // This can be controlled with [Cmd.exitCodeCheck].
        do!
            Cmd.createWithArgs "dotnet" [ "list"; "src/API/API.fsproj"; "package"; "--vulnerable" ]
            |> Cmd.run

        do!
            Cmd.createWithArgs "dotnet" [ "list"; "src/Downloads/Downloads.fsproj"; "package"; "--vulnerable" ]
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

        do!
            Cmd.createWithArgs "dotnet" [ "list"; "src/Downloads/Downloads.fsproj"; "package"; "--outdated" ]
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

// Skip the first 2 args as they are just a .dll thing and the file name.
let args = System.Environment.GetCommandLineArgs()[2..]

// Define your pipelines, for now we just want a simple "build" pipeline.
// You can define pipelines with parallel/conditional steps.
// You can also define pipelines from other pipelines.
Pipelines.create {
    let! defaultPipeline = Pipeline.create "default" { run devApi }
    do! Pipeline.create "dev-watch-api" { run devWatchApi }
    do! Pipeline.create "dev-api" { run devApi }
    do! Pipeline.create "dev-downloads" { run devDownloads }
    do! Pipeline.create "dev-watch-downloads" { run devWatchDownloads }
    do! Pipeline.create "lint" { run lint }
    do! Pipeline.create "outdated" { run outdated }
    do! Pipeline.create "audit" { run audit }

    default_pipeline defaultPipeline
}
|> Pipelines.runWithArgsAndExit args
