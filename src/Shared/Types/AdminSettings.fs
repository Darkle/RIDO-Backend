namespace RIDOTypes

type AdminSettings =
    { uniqueId: string
      numberMediaDownloadsAtOnce: int64
      numberImagesProcessAtOnce: int64
      updateAllDay: bool
      updateStartingHour: int64
      updateEndingHour: int64
      imageCompressionQuality: int64
      archiveImageCompressionQuality: int64
      maxImageWidthForNonArchiveImage: int64
      hasSeenWelcomeMessage: bool }
