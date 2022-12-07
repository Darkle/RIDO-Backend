interface Log {
  readonly created_at: number
  readonly level: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'
  readonly message?: string
  readonly service?: string
  readonly stack?: string
  readonly other?: Record<string, unknown>
}

interface LogReadyForDB extends Omit<Log, 'other'> {
  readonly other: string
}

export type { Log, LogReadyForDB }
