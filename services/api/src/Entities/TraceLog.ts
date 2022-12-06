import type { Log } from './Log'
// interface TraceLogTable {
//   readonly createdAt: number
//   readonly level: 'trace'
//   readonly message: string | null
//   readonly service: string | null
//   readonly stack: string | null
//   readonly other: string | null
// }

interface TraceLog extends Omit<Log, 'level'> {
  readonly level: 'trace'
}

export type { TraceLog }
