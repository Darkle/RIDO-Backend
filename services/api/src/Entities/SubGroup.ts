import type { SqliteBooleanType } from '../utils'

// interface SubGroupTable {
//   readonly sub_group: string
//   readonly favourited: SqliteBooleanType
// }

interface SubGroup {
  readonly sub_group: string
  readonly favourited: SqliteBooleanType
}

export type { SubGroup }
