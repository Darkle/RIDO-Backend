type TraceLog = {
  readonly createdAt: number
  readonly level: 'trace'
  readonly message?: string
  readonly service?: string
  readonly stack?: string
  readonly other?: Record<string, unknown>
}

export type { TraceLog }
