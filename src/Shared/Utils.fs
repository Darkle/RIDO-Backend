module Utils

open System.IO

let getProperEnvVarFilePath (envVarFilePath: string) =
    if envVarFilePath[0] = '/' then
        envVarFilePath
    else
        //TODO: is there a better way to find the root project folder? Remeber services are started from their respective subfolders where .fsproj file lies.
        Path.GetFullPath(Path.Join("..", "..", envVarFilePath))

let loadDotEnvFile (entryPointArgs: string array) =
    let isDev = entryPointArgs |> Array.contains "ISDEV"
    let dotEnvFileToLoad = if isDev then "../../.env.dev" else "../../.env"
    DotNetEnv.Env.Load(dotEnvFileToLoad) |> ignore        