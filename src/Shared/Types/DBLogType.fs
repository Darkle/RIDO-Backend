module API.DBLogType

type LogPreparedForDB =
    { createdAt: int64
      level: string
      message: string
      service: string
      stack: string
      other: string }