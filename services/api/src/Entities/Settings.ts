import type { SqliteBooleanType } from '../utils'

// interface SettingsTable {
//   readonly uniqueId: string
//   readonly numberMediaDownloadsAtOnce: number
//   readonly numberImagesProcessAtOnce: number
//   readonly updateAllDay: SqliteBooleanType
//   readonly updateStartingHour: number
//   readonly updateEndingHour: number
//   readonly imageCompressionQuality: number
//   readonly archiveImageCompressionQuality: number
//   readonly maxImageWidthForNonArchiveImage: number
//   readonly hasSeenWelcomeMessage: SqliteBooleanType
// }

interface Settings {
  readonly uniqueId: string
  readonly numberMediaDownloadsAtOnce: number
  readonly numberImagesProcessAtOnce: number
  readonly updateAllDay: boolean
  readonly updateStartingHour: number
  readonly updateEndingHour: number
  readonly imageCompressionQuality: number
  readonly archiveImageCompressionQuality: number
  readonly maxImageWidthForNonArchiveImage: number
  readonly hasSeenWelcomeMessage: SqliteBooleanType
}

export type { Settings }
