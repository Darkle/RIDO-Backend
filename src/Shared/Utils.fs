module Utils

open System.IO

let apiServerPort = DotNetEnv.Env.GetInt("API_SERVICE_PORT", 3030)
let apiServerAddress = sprintf "http://localhost:%i" apiServerPort

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
