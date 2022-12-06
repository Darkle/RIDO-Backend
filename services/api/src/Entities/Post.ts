import type { SqliteBooleanType } from '../utils'

interface PostTable {
  readonly postId: string
  readonly subreddit: string
  readonly title: string
  readonly postUrl: string
  readonly score: number
  readonly timestamp: number
  readonly mediaUrl: string
  readonly mediaHasBeenDownloaded: SqliteBooleanType
  readonly couldNotDownload: SqliteBooleanType
  readonly postMediaImagesHaveBeenProcessed: SqliteBooleanType
  readonly postMediaImagesProcessingError: string | null
  readonly postThumbnailsCreated: SqliteBooleanType
  readonly mediaDownloadTries: number
  readonly downloadedMediaCount: number
  readonly downloadError: string | null
  readonly downloadedMedia: string | null
}

interface Post {
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

export type { Post, PostTable }
