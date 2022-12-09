interface Log {
  readonly created_at: number
  readonly level: 'error' | 'warn' | 'info' | 'debug' | 'trace'
  readonly message?: string
  readonly service?: string
  readonly error?: string
  readonly misc_data?: unknown
}

// interface LogReadyForDB extends Omit<Log, 'misc_data'> {
//   readonly misc_data: string
// }

export type { Log }
