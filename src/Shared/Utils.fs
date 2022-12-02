module Utils

open System
open System.IO

// In .net the DateTime starts in year 0001 as opposed to 1970
let createUnixTimestamp () =
    Convert.ToInt64((DateTime.UtcNow - DateTime(1970, 1, 1, 0, 0, 0)).TotalMilliseconds)

// Needs to be a function as the .env vars arent available until .env file loaded.
let apiServerAddress () = 
    let apiServerPort = DotNetEnv.Env.GetInt("API_SERVICE_PORT", 3030)
    sprintf "http://localhost:%i" apiServerPort

let getProperEnvVarFilePath (envVarFilePath: string) =
    if envVarFilePath[0] = '/' then
        envVarFilePath
    else
        //TODO: is there a better way to find the root project folder? Remeber services are started from their respective subfolders where .fsproj file lies.
        Path.GetFullPath(Path.Join("..", "..", envVarFilePath))

let loadDotEnvFile () =
    // I checked and its ok to use DotNetEnv lib to get an env var even before you ask it to load the .env file
    let dotEnvFileToLoad =
        if DotNetEnv.Env.GetBool("ISDEV") then
            "../../.env.dev"
        else
            "../../.env"

    DotNetEnv.Env.Load(dotEnvFileToLoad) |> ignore
