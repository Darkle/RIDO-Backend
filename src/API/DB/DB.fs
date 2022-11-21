module API.DB

open Microsoft.Data.Sqlite
// open System.Data

let loggingDBPath = DotNetEnv.Env.GetString("LOGGINGDBPATH", "./logging.db")

//https://github.com/fsprojects/SQLProvider/issues/192
// [<Literal>]
// let dummy = "Data Source=" + "./asd.db" + "Version=3;foreign keys=true"

// [<Literal>]
// let resolutionPath = "/home/coop/.nuget/packages/sqlprovider/1.3.3/lib/net472"

let connectionString =
    "Data Source=" + loggingDBPath + "Version=3;foreign keys=true"

// type sql =
//     SqlDataProvider<Common.DatabaseProviderTypes.SQLITE, SQLiteLibrary=Common.SQLiteLibrary.SystemDataSQLite, ConnectionString=dummy, ResolutionPath=resolutionPath, CaseSensitivityChange=Common.CaseSensitivityChange.ORIGINAL>
// // open Donald

// let conn = new SqliteConnection(connectionString)
