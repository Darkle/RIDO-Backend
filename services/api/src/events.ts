import { EventEmitter } from 'tsee'

import type { SettingsSansId } from './Entities/Settings'

const EE = new EventEmitter<{
  readonly settingsUpdate: (settings: SettingsSansId) => void
}>()

export { EE }