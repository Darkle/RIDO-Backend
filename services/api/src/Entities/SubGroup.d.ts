interface SubGroup {
  readonly subGroup: string
  readonly favourited: boolean
}

/* eslint-disable functional/prefer-readonly-type */
interface SubGroupTable {
  subGroup: string
  favourited: boolean
}
/* eslint-enable functional/prefer-readonly-type */

export type { SubGroup, SubGroupTable }
