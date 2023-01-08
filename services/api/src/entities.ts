type DBTable = Settings | Log | Post | Feed | Tag

interface Settings {
  readonly numberMediaDownloadsAtOnce: number
  readonly numberImagesProcessAtOnce: number
  readonly updateAllDay: boolean
  readonly updateStartingHour: number
  readonly updateEndingHour: number
  readonly imageCompressionQuality: number
  readonly archiveImageCompressionQuality: number
  readonly maxImageWidthForNonArchiveImage: number
}

interface Log {
  readonly createdAt: Date
  readonly level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
  readonly message?: string
  readonly service?: string
  readonly error?: string
  readonly other?: string
}

type IncomingLog = Omit<Log, 'createdAt'>

interface Post {
  readonly uniqueId: string
  readonly postId: string
  readonly title: string
  readonly postUrl: string
  readonly score: number
  readonly timestamp: Date
  readonly mediaUrl: string
  readonly mediaHasBeenDownloaded: boolean
  readonly couldNotDownload: boolean
  readonly postMediaImagesHaveBeenProcessed: boolean
  readonly postThumbnailsCreated: boolean
  readonly postMediaImagesProcessingError?: string
  readonly downloadError?: string
  readonly mediaDownloadTries: number
  readonly downloadedMediaCount: number
  readonly downloadedMedia: string
  readonly tags?: readonly Tag[]
  readonly feed: Feed
}

type IncomingPost = Pick<Post, 'postId' | 'title' | 'postUrl' | 'score' | 'timestamp' | 'mediaUrl'>

interface Feed {
  readonly uniqueId: string
  // Making sure it includes a dot (some minor string type checking so that it looks like a domain)
  readonly domain: `${string}.${string}`
  readonly name: string
  readonly favourited: boolean
  // Feeds that come from forums may require a browser to scrape
  readonly requiresBrowserForSraping: boolean
  readonly updateCheck_lastUpdated: number
  // updateCheck_LastPostSeen is only used for non-reddit feeds.
  readonly updateCheck_LastPostSeen?: string
  readonly tags?: readonly Tag[]
  readonly posts?: readonly Post[]
}

type IncomingFeed = Pick<Feed, 'domain' | 'name'>

interface Tag {
  readonly tag: string
  readonly favourited: boolean
  readonly feeds?: readonly Feed[]
  readonly posts?: readonly Post[]
}

export type { Log, Post, Feed, Tag, Settings, DBTable, IncomingPost, IncomingLog, IncomingFeed }
