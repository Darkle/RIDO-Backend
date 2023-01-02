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
  readonly feed: string
  readonly tags?: readonly string[]
  readonly feedDomain: string
  readonly feedId: string
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
  readonly postMediaImagesProcessingError?: string
  readonly downloadError?: string
  readonly mediaDownloadTries: number
  readonly downloadedMediaCount: number
  readonly downloadedMedia?: readonly string[]
}

interface Feed {
  readonly tags?: readonly string[]
  readonly posts?: readonly string[]
  readonly feedDomain: string
  readonly feedId: string
  readonly favourited: boolean
  readonly lastUpdated: number
  // updateCheck_LastPostSeen is only used for non-reddit feeds.
  readonly updateCheck_LastPostSeen?: string
}

interface Tag {
  readonly feeds?: readonly string[]
  readonly posts?: readonly string[]
  readonly tag: string
  readonly favourited: boolean
}

export type { Log, Post, Feed, Tag, Settings }
