module RPC.Client

open Fable.Remoting.DotnetClient
open API.Types

let apiServerAddress = Utils.apiServerAddress () + "/api/"

let apiClient = Remoting.createApi apiServerAddress |> Remoting.buildProxy<IAPI>
