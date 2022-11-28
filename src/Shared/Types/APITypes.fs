module API.Types

open API.DBLogType

type IAPI = { addLog: LogPreparedForDB -> Async<unit> }
