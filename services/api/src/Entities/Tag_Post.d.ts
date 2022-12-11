interface Tag_Post {
  readonly tag: string
  readonly post_id: string
}

/* eslint-disable functional/prefer-readonly-type */
interface Tag_PostTable {
  tag: string
  post_id: string
}
/* eslint-enable functional/prefer-readonly-type */

export type { Tag_Post, Tag_PostTable }
