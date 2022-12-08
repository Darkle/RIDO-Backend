interface Log {
  readonly created_at: number
  readonly level: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly' | 'trace'
  readonly message?: string
  readonly service?: string
  readonly stack?: string
  readonly log_other?: Record<string, unknown>
}

// interface LogReadyForDB extends Omit<Log, 'log_other'> {
//   readonly log_other: string
// }

export type { Log }
