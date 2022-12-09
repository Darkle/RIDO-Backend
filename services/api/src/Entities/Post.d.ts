interface Post {
  readonly post_id: string
  readonly subreddit: string
  readonly title: string
  readonly post_url: string
  readonly score: number
  readonly timestamp: number
  readonly media_url: string
  readonly media_has_been_downloaded: boolean
  readonly could_not_download: boolean
  readonly post_media_images_have_been_processed: boolean
  readonly post_media_images_processing_eError?: string
  readonly post_thumbnails_created: boolean
  readonly media_download_tries: number
  readonly downloaded_media_count: number
  readonly download_error?: string
  readonly downloaded_media?: readonly string[]
}

// interface PostForReadyForDB extends Omit<Post, 'downloaded_media'> {
//   readonly downloaded_media: string
// }

export type { Post }
