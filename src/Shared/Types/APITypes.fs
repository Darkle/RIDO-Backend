module API.Types

open Log

type IAPI = { addLog: LogPreparedForDB -> unit }
