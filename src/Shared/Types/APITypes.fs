module API.Types

open API.LogType

type IAPI = { addLog: LogPreparedForDB -> Async<unit> }
