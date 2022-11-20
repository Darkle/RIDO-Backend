module API.DB

open System
open Microsoft.Data.Sqlite
open Dapper.FSharp

// https://github.com/Dzoukr/Dapper.FSharp#getting-started

let init () =
    OptionTypes.register ()
    let conn = new SqliteConnection("Data Source=test.db;Version=3;New=True;")

    conn.Open()
// conn :> IDbConnection

type Person =
    { Id: Guid
      FirstName: string
      LastName: string
      Position: int
      DateOfBirth: DateTime option }

let newPerson =
    { Id = Guid.NewGuid()
      FirstName = "Roman"
      LastName = "Provaznik"
      Position = 1
      DateOfBirth = None }

let personTable = table<Person>

insert {
    into personTable
    value newPerson
}
|> conn.InsertAsync
