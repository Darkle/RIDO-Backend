import { z } from 'zod'

const LogZSchema = z.object({
  createdAt: z.number().positive(),
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
  other: z.unknown().optional(),
})

const defaultSearchResultLimit = 100

const logSearchZSchema = z.object({
  page: z.number().default(1),
  limit: z.number().optional().default(defaultSearchResultLimit),
  searchQuery: z.string().optional(),
  logLevelFilter: z.enum(['all', 'error', 'warn', 'info', 'debug', 'trace']).default('all'),
})

const PostZSchema = z.object({
  postId: z.string().min(2),
  subreddit: z.string().min(2),
  title: z.string().min(2),
  postUrl: z.string().url(),
  score: z.number(),
  timestamp: z.number().positive(),
  mediaUrl: z.string().url(),
  mediaHasBeenDownloaded: z.boolean(),
  couldNotDownload: z.boolean(),
  postMediaImagesHaveBeenProcessed: z.boolean(),
  postMediaImagesProcessingError: z.string().optional(),
  postThumbnailsCreated: z.boolean(),
  mediaDownloadTries: z.number().gt(-1).default(0),
  downloadedMediaCount: z.number().gt(-1).default(0),
  downloadError: z.string().optional(),
  downloadedMedia: z.array(z.string()).optional(),
})
/* eslint-disable @typescript-eslint/no-magic-numbers */

const SettingsZSchema = z
  .object({
    uniqueId: z.literal('settings').optional(),
    numberMediaDownloadsAtOnce: z.number().positive(),
    numberImagesProcessAtOnce: z.number().positive(),
    updateAllDay: z.boolean(),
    updateStartingHour: z.number(),
    updateEndingHour: z.number(),
    imageCompressionQuality: z.number().min(1).max(100),
    archiveImageCompressionQuality: z.number().min(1).max(100),
    maxImageWidthForNonArchiveImage: z.number().positive(),
  })
  // will never be adding new one, so can all be partial
  .partial()
/* eslint-enable @typescript-eslint/no-magic-numbers */

const SubGroupZSchema = z.object({
  subGroup: z.string().min(1),
  favourited: z.boolean(),
})

const SubredditZSchema = z.object({
  subreddit: z.string().min(1),
  favourited: z.boolean(),
  lastUpdated: z.number().gt(-1),
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
