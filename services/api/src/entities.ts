import type { Jsonifiable } from 'type-fest'

type DBTable = Settings | Log | Post | Feed | Tag

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

type IncomingLog = Omit<Log, 'createdAt' | 'otherAsStr'>

interface Post {
  readonly uniqueId: `${Feed['domain']}-${Post['postId']}`
  readonly postId: string
  readonly tags?: readonly Tag[]
  readonly feed: Feed
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

type IncomingPost = Pick<Post, 'postId' | 'title' | 'postUrl' | 'score' | 'timestamp' | 'mediaUrl'>

interface Feed {
  readonly uniqueId: `${Feed['domain']}-${Feed['name']}`
  readonly tags?: readonly Tag[]
  readonly posts?: readonly Post[]
  // Making sure it includes a dot (some minor string type checking so that it looks like a domain)
  readonly domain: `${string}.${string}`
  readonly name: string
  readonly favourited: boolean
  // Feeds that come from forums may require a browser to scrape
  readonly requiresBrowserForSraping?: boolean
  readonly updateCheck_lastUpdated: number
  // updateCheck_LastPostSeen is only used for non-reddit feeds.
  readonly updateCheck_LastPostSeen?: string
}

type IncomingFeed = Pick<Feed, 'domain' | 'name'>

interface Tag {
  readonly feeds?: readonly Feed[]
  readonly posts?: readonly Post[]
  readonly tag: string
  readonly favourited: boolean
}

export type { Log, Post, Feed, Tag, Settings, DBTable, IncomingPost, IncomingLog, IncomingFeed }
