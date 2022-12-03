namespace RIDOTypes

type AdminSettings =
    { uniqueId: string
      numberMediaDownloadsAtOnce: int
      numberImagesProcessAtOnce: int
      updateAllDay: bool
      updateStartingHour: int
      updateEndingHour: int
      imageCompressionQuality: int
      archiveImageCompressionQuality: int
      maxImageWidthForNonArchiveImage: int }
