import type { Brand } from 'ts-brand'

interface SubGroup {
  readonly sub_group: string
  readonly favourited: boolean
}

/* eslint-disable functional/prefer-readonly-type */
interface SubGroupTable {
  sub_group: string
  favourited: Brand<number, 'SQLiteBool'>
}
/* eslint-enable functional/prefer-readonly-type */

export type { SubGroup, SubGroupTable }
