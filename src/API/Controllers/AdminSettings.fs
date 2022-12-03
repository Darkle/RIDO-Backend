module API.AdminSettings

open Donald
open System.Data

let ofDataReader (rd: IDataReader) : RIDOTypes.AdminSettings =
    { uniqueId = rd.ReadString "uniqueId"
      numberMediaDownloadsAtOnce = rd.ReadInt64 "numberMediaDownloadsAtOnce"
      numberImagesProcessAtOnce = rd.ReadInt64 "numberImagesProcessAtOnce"
      updateAllDay = rd.ReadBoolean "updateAllDay"
      updateStartingHour = rd.ReadInt64 "uniqueId"
      updateEndingHour = rd.ReadInt64 "uniqueId"
      imageCompressionQuality = rd.ReadInt64 "uniqueId"
      archiveImageCompressionQuality = rd.ReadInt64 "uniqueId"
      maxImageWidthForNonArchiveImage = rd.ReadInt64 "uniqueId"

    }

let getAdminSettings () =
    let sql = "SELECT * from AdminSettings where uniqueId = 'admin-settings'"

    DB.ridoDB |> Db.newCommand sql |> Db.Async.querySingle ofDataReader
