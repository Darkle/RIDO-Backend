interface Tag {
  readonly tag: string
  readonly favourited: boolean
}

/* eslint-disable functional/prefer-readonly-type */
interface TagTable {
  tag: string
  favourited: boolean
}
/* eslint-enable functional/prefer-readonly-type */

export type { Tag, TagTable }
