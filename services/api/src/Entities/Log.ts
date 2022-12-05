type LogPreparedForDB = {
  readonly createdAt: number
  readonly level: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'
  readonly message?: string
  readonly service?: string
  readonly stack?: string
  readonly other?: Record<string, unknown>
}

export type { LogPreparedForDB }
