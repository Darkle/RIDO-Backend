interface Log {
  /*****
   Using bigint so can have more resolution. Otherwise logs that are called at the exact same time (in the same process)
   can have the exact same time if use Date.now(), which makes it hard to trace which log came first. 
  *****/
  readonly created_at: bigint
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
