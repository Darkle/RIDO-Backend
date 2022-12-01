module API.DB

open Microsoft.Data.Sqlite

let loggingDBPath =
    Utils.getProperEnvVarFilePath (DotNetEnv.Env.GetString("DATA_FOLDER", "./data"))
    + "/logging.db"

let loggingDBConnectionString = "Filename=" + loggingDBPath + ";foreign keys=true"

// Breaks without using `new`
// fsharplint:disable-next-line RedundantNewKeyword
let logsDB = new SqliteConnection(loggingDBConnectionString)

let ridoDBPath =
    Utils.getProperEnvVarFilePath (DotNetEnv.Env.GetString("DATA_FOLDER", "./data"))
    + "/RIDO.db"

let ridoDBConnectionString = "Filename=" + ridoDBPath + ";foreign keys=true"

// Breaks without using `new`
// fsharplint:disable-next-line RedundantNewKeyword
let ridoDB = new SqliteConnection(ridoDBConnectionString)
