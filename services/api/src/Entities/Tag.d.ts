import type { Brand } from 'ts-brand'

interface Tag {
  readonly tag: string
  readonly favourited: boolean
}

/* eslint-disable functional/prefer-readonly-type */
interface TagTable {
  tag: string
  // null here signifies to the orm that its optional. But also note that we have these set to a default value in the .sql schema
  favourited: Brand<number, 'SQLiteBool'> | null
}
/* eslint-enable functional/prefer-readonly-type */

export type { Tag, TagTable }
