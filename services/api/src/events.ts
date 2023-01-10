import type { Settings } from '@prisma/client'
import { EventEmitter } from 'tsee'


const EE = new EventEmitter<{
  readonly settingsUpdate: (settings: Settings) => void
}>()

export { EE }
