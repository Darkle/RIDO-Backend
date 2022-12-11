interface Subreddit {
  readonly subreddit: string
  readonly favourited: boolean
  readonly last_updated: number
}

/* eslint-disable functional/prefer-readonly-type */
interface SubredditTable {
  subreddit: string
  favourited: boolean
  last_updated: number
}
/* eslint-enable functional/prefer-readonly-type */

export type { Subreddit, SubredditTable }
