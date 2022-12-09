import { z } from 'zod'

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

const PostZSchema = z.object({
  post_id: z.string().min(2),
  subreddit: z.string().min(2),
  title: z.string().min(2),
  post_url: z.string().url(),
  score: z.number(),
  timestamp: z.number().positive(),
  media_url: z.string().url(),
  media_has_been_downloaded: z.boolean(),
  could_not_download: z.boolean(),
  post_media_images_have_been_processed: z.boolean(),
  post_media_images_processing_eError: z.string().optional(),
  post_thumbnails_created: z.boolean(),
  media_download_tries: z.number().gt(-1).default(0),
  downloaded_media_count: z.number().gt(-1).default(0),
  download_error: z.string().optional(),
  downloaded_media: z.array(z.string()).optional(),
})

// interface PostForReadyForDB extends Omit<Post, 'downloaded_media'> {
//   readonly downloaded_media: string
// }

export type { Post }

export { PostZSchema }
