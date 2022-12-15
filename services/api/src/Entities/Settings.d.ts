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
}

/* eslint-disable functional/prefer-readonly-type */
interface SettingsTable {
  uniqueId: string
  numberMediaDownloadsAtOnce: number
  numberImagesProcessAtOnce: number
  updateAllDay: boolean
  updateStartingHour: number
  updateEndingHour: number
  imageCompressionQuality: number
  archiveImageCompressionQuality: number
  maxImageWidthForNonArchiveImage: number
}
/* eslint-enable functional/prefer-readonly-type */

type SettingsSansId = Omit<Settings, 'uniqueId'>

export type { Settings, SettingsSansId, SettingsTable }
