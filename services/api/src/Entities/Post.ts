type Post = {
  readonly postId: string
  readonly subreddit: string
  readonly title: string
  readonly postUrl: string
  readonly score: number
  readonly timestamp: number
  readonly mediaUrl: string
  readonly mediaHasBeenDownloaded: boolean
  readonly couldNotDownload: boolean
  readonly postMediaImagesHaveBeenProcessed: boolean
  readonly postMediaImagesProcessingError?: string
  readonly postThumbnailsCreated: boolean
  readonly mediaDownloadTries: number
  readonly downloadedMediaCount: number
  readonly downloadError?: string
  readonly downloadedMedia?: readonly string[]
}

export type { Post }
