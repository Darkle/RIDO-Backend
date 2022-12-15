interface Log {
  readonly createdAt: number
  readonly level: 'error' | 'warn' | 'info' | 'debug' | 'trace'
  readonly message?: string
  readonly service?: string
  readonly error?: string
  readonly other?: unknown
}

/* eslint-disable functional/prefer-readonly-type */
interface LogTable {
  createdAt: number
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace'
  message: string | null
  service: string | null
  error: string | null
  other: unknown
}
/* eslint-enable functional/prefer-readonly-type */

// interface LogReadyForDB extends Omit<Log, 'other'> {
//   readonly other: string
// }

export type { Log, LogTable }
