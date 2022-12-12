import type { Brand } from 'ts-brand'

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
  readonly post_media_images_processing_Error?: string
  readonly post_thumbnails_created: boolean
  readonly media_download_tries: number
  readonly downloaded_media_count: number
  readonly download_error?: string
  readonly downloaded_media?: readonly string[]
}

/* eslint-disable functional/prefer-readonly-type */
interface PostTable {
  post_id: string
  subreddit: string
  title: string
  post_url: string
  score: number
  timestamp: number
  media_url: string
  media_has_been_downloaded: Brand<number, 'SQLiteBool'>
  could_not_download: Brand<number, 'SQLiteBool'>
  post_media_images_have_been_processed: Brand<number, 'SQLiteBool'>
  post_media_images_processing_Error: string | null
  post_thumbnails_created: Brand<number, 'SQLiteBool'>
  media_download_tries: number
  downloaded_media_count: number
  download_error: string | null
  downloaded_media: readonly string[] | null
}
/* eslint-enable functional/prefer-readonly-type */

// interface PostForReadyForDB extends Omit<Post, 'downloaded_media'> {
//   readonly downloaded_media: string
// }

export type { Post, PostTable }
