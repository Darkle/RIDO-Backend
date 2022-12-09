import { z } from 'zod'

interface Log {
  readonly created_at: number
  readonly level: 'error' | 'warn' | 'info' | 'debug' | 'trace'
  readonly message?: string
  readonly service?: string
  readonly stack?: string
  readonly log_other?: Record<string, unknown>
}

const LogZSchema = z.object({
  created_at: z.number().positive(),
  level: z.union([
    z.literal('error'),
    z.literal('warn'),
    z.literal('info'),
    z.literal('debug'),
    z.literal('trace'),
  ]),
  message: z.string().optional(),
  service: z.string().optional(),
  stack: z.string().optional(),
  log_other: z.unknown().optional(),
})

// interface LogReadyForDB extends Omit<Log, 'log_other'> {
//   readonly log_other: string
// }

export type { Log }
export { LogZSchema }
