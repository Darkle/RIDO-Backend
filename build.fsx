#!/usr/bin/env -S dotnet fsi
// the hash bang here allows us to run the build script without invoking dotnet manually
// The ‘-S’ option instructs ‘env’ to split the single string into multiple arguments

// It is recommended to specify a version
#r "nuget: FsMake, 0.6.1"

open FsMake

// To import from another fsx/fs script
// #load "build-foo.fsx"
// Assuming `foo` is the thing that "build-foo.fsx" exports, dont forget to open it:
// open foo
// You should now have access to stuff in the foo module in this script


// Skip the first 2 args as they are just a .dll thing and the file name.
let args = System.Environment.GetCommandLineArgs()[2..]

// Creates a restore step.
let dev =
    Step.create "dev" {
        // Commands that return an exit code other than 0 fail the step by default.
        // This can be controlled with [Cmd.exitCodeCheck].
        do! Cmd.createWithArgs "echo" [ "restore dev" ] |> Cmd.run
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

    do! Pipeline.create "lint" { run lint }

    do! Pipeline.create "dev" { run dev }

    default_pipeline defaultPipeline
}
|> Pipelines.runWithArgsAndExit args
