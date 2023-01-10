import { z, type ZodSchema } from 'zod'
import type { Feed, Settings, Tag } from '@prisma/client'

import type { IncomingLog } from './db/db-log-methods'
import type { IncomingPost } from './db/db-post-methods'

type IncomingFeed = Pick<Feed, 'name' | 'domain'>

// https://zod.dev/?id=custom-schemas
const feedDomainZSchema = z.custom<IncomingFeed['domain']>(val =>
  typeof val === 'string' ? val.includes('.') && val.length : false
)

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

const incomingPostsZodSchema: ZodSchema<{
  readonly feedDomain: Feed['domain']
  readonly feedName: Feed['name']
  readonly posts: readonly IncomingPost[]
}> = z.object({
  feedDomain: feedDomainZSchema,
  feedName: z.string().min(2),
  posts: z.array(
    z.object({
      postId: z.string().min(2),
      title: z.string().min(2),
      postUrl: z.string().url(),
      score: z.number(),
      timestamp: z.date(),
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
  ),
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
  domain: feedDomainZSchema,
  name: z.string().min(1),
})

const TagZodSchema: ZodSchema<Pick<Tag, 'tag'>> = z.object({
  tag: z.string().min(1),
})

export {
  incomingLogZodSchema,
  incomingPostsZodSchema,
  incomingSettingsZodSchema,
  incomingFeedZodSchema,
  TagZodSchema,
  logSearchZodSchema,
  feedDomainZSchema,
}
