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
  readonly hasSeenWelcomeMessage: boolean
}

export type { Settings }
