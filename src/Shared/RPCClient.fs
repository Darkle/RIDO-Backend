module RPC.Client

open Fable.Remoting.DotnetClient
open RIDOTypes

let apiServerAddress = Utils.getApiServerAddress ()

let apiClient = Remoting.createApi apiServerAddress |> Remoting.buildProxy<IAPI>
