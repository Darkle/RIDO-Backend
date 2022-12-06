import type { SqliteBooleanType } from '../utils'

// interface SubredditTable {
//   readonly subreddit: string
//   readonly favourited: SqliteBooleanType
//   readonly lastUpdated: number
// }

interface Subreddit {
  readonly subreddit: string
  readonly favourited: SqliteBooleanType
  readonly lastUpdated: number
}

export type { Subreddit }
