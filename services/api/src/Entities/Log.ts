// interface LogTable {
//   readonly createdAt: number
//   readonly level: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'
//   readonly message: string | null
//   readonly service: string | null
//   readonly stack: string | null
//   readonly other: string | null
// }

interface Log {
  readonly createdAt: number
  readonly level: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'
  readonly message?: string
  readonly service?: string
  readonly stack?: string
  readonly other?: Record<string, unknown>
}

export type { Log }
