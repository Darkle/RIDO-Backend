import type { SqliteBooleanType } from '../utils'

// interface TagTable {
//   readonly tag: string
//   readonly favourited: SqliteBooleanType
// }

interface Tag {
  readonly tag: string
  readonly favourited: SqliteBooleanType
}

export type { Tag }
