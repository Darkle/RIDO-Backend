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
  readonly post_media_images_processing_eError?: string
  readonly postThumbnailsCreated: boolean
  readonly mediaDownloadTries: number
  readonly downloadedMediaCount: number
  readonly downloadError?: string
  readonly downloadedMedia?: readonly string[]
}

/* eslint-disable functional/prefer-readonly-type */
interface PostTable {
  postId: string
  subreddit: string
  title: string
  postUrl: string
  score: number
  timestamp: number
  mediaUrl: string
  mediaHasBeenDownloaded: boolean
  couldNotDownload: boolean
  postMediaImagesHaveBeenProcessed: boolean
  post_media_images_processing_eError: string | null
  postThumbnailsCreated: boolean
  mediaDownloadTries: number
  downloadedMediaCount: number
  downloadError: string | null
  downloadedMedia: readonly string[] | null
}
/* eslint-enable functional/prefer-readonly-type */

// interface PostForReadyForDB extends Omit<Post, 'downloadedMedia'> {
//   readonly downloadedMedia: string
// }

export type { Post, PostTable }
