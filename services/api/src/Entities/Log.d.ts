interface Log {
  readonly created_at: number
  readonly level: 'error' | 'warn' | 'info' | 'debug' | 'trace'
  readonly message?: string
  readonly service?: string
  readonly error?: string
  readonly misc_data?: unknown
}

/* eslint-disable functional/prefer-readonly-type */
interface LogTable {
  created_at: number
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace'
  message: string | null
  service: string | null
  error: string | null
  misc_data: unknown
}
/* eslint-enable functional/prefer-readonly-type */

// interface LogReadyForDB extends Omit<Log, 'misc_data'> {
//   readonly misc_data: string
// }

export type { Log, LogTable }
