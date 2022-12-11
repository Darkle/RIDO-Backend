interface Subreddit_SubGroup {
  readonly subreddit: string
  readonly sub_group: string
}

/* eslint-disable functional/prefer-readonly-type */
interface Subreddit_SubGroupTable {
  subreddit: string
  sub_group: string
}
/* eslint-enable functional/prefer-readonly-type */

export type { Subreddit_SubGroup, Subreddit_SubGroupTable }
