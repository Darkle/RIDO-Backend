module API.DB

open Microsoft.Data.Sqlite

let loggingDBPath = DotNetEnv.Env.GetString("LOGGINGDBPATH", "./logging.db")

let connectionString =
    "Data Source=" + loggingDBPath + "Version=3;foreign keys=true"

// fsharplint:disable-next-line RedundantNewKeyword
let conn = new SqliteConnection(connectionString)
