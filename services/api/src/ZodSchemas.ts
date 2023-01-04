import { z, type ZodSchema } from 'zod'
import type { IncomingPost, Settings, IncomingFeed, Tag, IncomingLog } from './entities'

// From https://zod.dev/?id=json-type
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
type Literal = z.infer<typeof literalSchema>
type Json = Literal | { readonly [key: string]: Json } | readonly Json[]
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
)

const incomingLogZodSchema: ZodSchema<IncomingLog> = z.object({
  createdAt: z.number().positive(),
  level: z.union([
    z.literal('fatal'),
    z.literal('error'),
    z.literal('warn'),
    z.literal('info'),
    z.literal('debug'),
    z.literal('trace'),
  ]),
  message: z.string().optional(),
  service: z.string().optional(),
  error: z.string().optional(),
  other: jsonSchema,
})

const defaultSearchResultLimit = 100

const logSearchZodSchema = z.object({
  page: z.number().default(1),
  limit: z.number().optional().default(defaultSearchResultLimit),
  searchQuery: z.string().optional(),
  logLevelFilter: z.enum(['all', 'error', 'warn', 'info', 'debug', 'trace']).default('all'),
})

const incomingPostZodSchema: ZodSchema<IncomingPost> = z.object({
  postId: z.string().min(2),
  title: z.string().min(2),
  postUrl: z.string().url(),
  score: z.number(),
  timestamp: z.number().positive(),
  mediaUrl: z.string().url(),
  mediaHasBeenDownloaded: z.boolean().default(false).optional(),
  couldNotDownload: z.boolean().default(false).optional(),
  postMediaImagesHaveBeenProcessed: z.boolean().default(false).optional(),
  postMediaImagesProcessingError: z.string().optional(),
  postThumbnailsCreated: z.boolean().default(false).optional(),
  mediaDownloadTries: z.number().gt(-1).default(0).optional(),
  downloadedMediaCount: z.number().gt(-1).default(0).optional(),
  downloadError: z.string().optional(),
  downloadedMedia: z.array(z.string()).optional(),
})

/* eslint-disable @typescript-eslint/no-magic-numbers */

const incomingSettingsZodSchema: ZodSchema<Partial<Settings>> = z
  .object({
    numberMediaDownloadsAtOnce: z.number().positive(),
    numberImagesProcessAtOnce: z.number().positive(),
    updateAllDay: z.boolean(),
    updateStartingHour: z.number().min(0).max(23),
    updateEndingHour: z.number().min(0).max(23),
    imageCompressionQuality: z.number().min(1).max(100),
    archiveImageCompressionQuality: z.number().min(1).max(100),
    maxImageWidthForNonArchiveImage: z.number().positive(),
  })
  // will never be adding new one, so can all be partial
  .partial()

/* eslint-enable @typescript-eslint/no-magic-numbers */

const incomingFeedZodSchema: ZodSchema<IncomingFeed> = z.object({
  // https://zod.dev/?id=custom-schemas
  feedDomain: z.custom<IncomingFeed['feedDomain']>(val =>
    typeof val === 'string' ? val.includes('.') && val.length : false
  ),
  feedId: z.string().min(1),
})

const TagZodSchema: ZodSchema<Pick<Tag, 'tag'>> = z.object({
  tag: z.string().min(1),
})

export {
  incomingLogZodSchema,
  incomingPostZodSchema,
  incomingSettingsZodSchema,
  incomingFeedZodSchema,
  TagZodSchema,
  logSearchZodSchema,
}
