interface Subreddit {
  readonly subreddit: string
  readonly favourited: boolean
  readonly lastUpdated: number
}

/* eslint-disable functional/prefer-readonly-type */
interface SubredditTable {
  subreddit: string
  // null here signifies to the orm that its optional. But also note that we have these set to a default value in the .sql schema
  favourited: boolean | null
  lastUpdated: number | null
}
/* eslint-enable functional/prefer-readonly-type */

export type { Subreddit, SubredditTable }
