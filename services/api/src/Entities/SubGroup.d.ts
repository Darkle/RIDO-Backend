interface SubGroup {
  readonly sub_group: string
  readonly favourited: boolean
}

/* eslint-disable functional/prefer-readonly-type */
interface SubGroupTable {
  sub_group: string
  favourited: boolean
}
/* eslint-enable functional/prefer-readonly-type */

export type { SubGroup, SubGroupTable }
