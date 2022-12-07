import type { Log } from './Log'

interface TraceLog extends Omit<Log, 'level'> {
  readonly level: 'trace'
}

interface TraceLogReadyForDB extends Omit<TraceLog, 'other'> {
  readonly other: string
}

export type { TraceLog, TraceLogReadyForDB }
