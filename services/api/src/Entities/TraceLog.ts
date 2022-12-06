import type { Log } from './Log'

interface TraceLog extends Omit<Log, 'level'> {
  readonly level: 'trace'
}

export type { TraceLog }
