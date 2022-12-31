import type { Jsonifiable } from 'type-fest'

interface Settings {
  readonly numberMediaDownloadsAtOnce: number
  readonly numberImagesProcessAtOnce: number
  readonly updateAllDay: boolean
  readonly updateStartingHour: number
  readonly updateEndingHour: number
  readonly imageCompressionQuality: number
  readonly maxImageWidthForNonArchiveImage: number
}

interface Log {
  readonly createdAt: number
  readonly level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
  readonly message?: string
  readonly service?: string
  readonly error?: string
  readonly other?: Jsonifiable
  readonly otherAsStr?: string
}

interface Post {
  readonly postId: string
  readonly feed: Feed
  readonly tags?: readonly Tag[]
  readonly feedType: string
  readonly feedName: string
  readonly uniqueId: string
  readonly title: string
  readonly postUrl: string
  readonly score: number
  // The timestamp is taken from the post's created_utc property, which is a unix timestamp (ie the number of _SECONDS_ since the epoch). It's UTC is GMT, aka no timezone.
  readonly timestamp: number
  readonly mediaUrl: string
  readonly mediaHasBeenDownloaded: boolean
  readonly couldNotDownload: boolean
  readonly postMediaImagesHaveBeenProcessed: boolean
  readonly postThumbnailsCreated: boolean
  readonly postMediaImagesProcessingError?: boolean
  readonly downloadError?: boolean
  readonly mediaDownloadTries: number
  readonly downloadedMediaCount: number
  readonly downloadedMedia?: readonly string[]
}

interface Feed {
  readonly tags?: readonly Tag[]
  readonly posts?: readonly Post[]
  readonly feedId: string
  readonly feedType: string
  readonly feedName: string
  readonly favourited: boolean
  readonly lastUpdated: number
  // updateCheck_LastPostSeen is only used for non-reddit feeds.
  readonly updateCheck_LastPostSeen: string
}

interface Tag {
  readonly feeds?: readonly Feed[]
  readonly posts?: readonly Post[]
  readonly tag: string
  readonly favourited: boolean
}

export type { Log, Post, Feed, Tag, Settings }
