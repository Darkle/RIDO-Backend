module API.Routes

open API.Impl
open Giraffe
open Microsoft
open Microsoft.AspNetCore.Http

let routes: HttpFunc -> AspNetCore.Http.HttpContext -> HttpFuncResult =
    choose
        [ subRouteCi
              "/api"
              (choose
                  [ GET >=> choose [ routeCix "/foo" >=> text "thing" ]
                    POST >=> choose [ routeCix "/save-log-to-db" >=> saveLogToDB ] ])

          // If none of the routes matched then return a 404
          setStatusCode StatusCodes.Status404NotFound >=> text "Not Found" ]
