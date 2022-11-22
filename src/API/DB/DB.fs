module API.DB

open Microsoft.Data.Sqlite

let loggingDBPath =
    DotNetEnv.Env.GetString("LOGGINGDBPATH", "./logging.db")
    |> Utils.getProperEnvVarFilePath

let loggingDBConnectionString = "Filename=" + loggingDBPath + ";foreign keys=true"

// fsharplint:disable-next-line RedundantNewKeyword
let logsDB = new SqliteConnection(loggingDBConnectionString)
