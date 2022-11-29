module API.Types

open API.DBLogType
// open Donald

type IAPI = { addLog: LogPreparedForDB -> Async<unit> }
