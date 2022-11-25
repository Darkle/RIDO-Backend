module API

open API.LogIngestion
open API.Types

let API: IAPI = { addLog = saveLogToDB }
