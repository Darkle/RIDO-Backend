module API

open API.LogIngestion
open API.Types

let musicStore: IAPI = { addLog = saveLogToDB }
