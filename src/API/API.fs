module API.Impl

open API.LogIngestion
open API.Types

let api: IAPI = { addLog = saveLogToDB }
