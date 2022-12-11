interface Subreddit_Post {
  readonly subreddit: string
  readonly post_id: string
}

/* eslint-disable functional/prefer-readonly-type */
interface Subreddit_PostTable {
  subreddit: string
  post_id: string
}
/* eslint-enable functional/prefer-readonly-type */

export type { Subreddit_Post, Subreddit_PostTable }
