module RPC.Client

open Fable.Remoting.DotnetClient
open API.Types

let apiServerPort = DotNetEnv.Env.GetInt("API_SERVICE_PORT", 3030)
let apiServerAddress = sprintf "http://localhost:%i/api" apiServerPort

let apiClient = Remoting.createApi apiServerAddress |> Remoting.buildProxy<IAPI>