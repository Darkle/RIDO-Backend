import { EventEmitter } from 'tsee'

import type { Settings } from '../dbschema/interfaces'

const EE = new EventEmitter<{
  readonly settingsUpdate: (settings: Omit<Settings, 'uniqueId'>) => void
}>()

export { EE }
