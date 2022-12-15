import { z } from 'zod'

const LogZSchema = z.object({
  created_at: z.number().positive(),
  level: z.union([
    z.literal('error'),
    z.literal('warn'),
    z.literal('info'),
    z.literal('debug'),
    z.literal('trace'),
  ]),
  message: z.string().optional(),
  service: z.string().optional(),
  error: z.string().optional(),
  misc_data: z.unknown().optional(),
})

const defaultSearchResultLimit = 100

const logSearchZSchema = z.object({
  page: z.number().default(1),
  limit: z.number().optional().default(defaultSearchResultLimit),
  searchQuery: z.string().optional(),
  logLevelFilter: z.enum(['all', 'error', 'warn', 'info', 'debug', 'trace']).default('all'),
})

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
  post_media_images_processing_Error: z.string().optional(),
  post_thumbnails_created: z.boolean(),
  media_download_tries: z.number().gt(-1).default(0),
  downloaded_media_count: z.number().gt(-1).default(0),
  download_error: z.string().optional(),
  downloaded_media: z.array(z.string()).optional(),
})
/* eslint-disable @typescript-eslint/no-magic-numbers */

const SettingsZSchema = z
  .object({
    unique_id: z.literal('settings').optional(),
    number_media_downloads_at_once: z.number().positive(),
    number_images_process_at_once: z.number().positive(),
    update_all_day: z.boolean(),
    update_starting_hour: z.number(),
    update_ending_hour: z.number(),
    image_compression_quality: z.number().min(1).max(100),
    archive_image_compression_quality: z.number().min(1).max(100),
    max_image_width_for_non_archive_image: z.number().positive(),
    has_seen_welcome_message: z.boolean(),
  })
  // will never be adding new one, so can all be partial
  .partial()
/* eslint-enable @typescript-eslint/no-magic-numbers */

const SubGroupZSchema = z.object({
  sub_group: z.string().min(1),
  favourited: z.boolean(),
})

const SubredditZSchema = z.object({
  subreddit: z.string().min(1),
  favourited: z.boolean(),
  last_updated: z.number().gt(-1),
})

const TagZSchema = z.object({
  tag: z.string().min(1),
  favourited: z.boolean(),
})
export {
  LogZSchema,
  PostZSchema,
  SettingsZSchema,
  SubGroupZSchema,
  SubredditZSchema,
  TagZSchema,
  logSearchZSchema,
}
