import { z } from 'zod'

import { DB } from '../db/db'
import { trpc } from '../api'
import { feedDomainZSchema, incomingPostsZodSchema } from '../ZodSchemas'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-lines-per-function
const postRoutes = () =>
  trpc.router({
    // fetchAllPostIds: trpc.procedure.query(() => DB.fetchAllPostIds()),
    getPostsThatNeedMediaToBeDownloaded: trpc.procedure.query(() => DB.getPostsThatNeedMediaToBeDownloaded()),
    getPostsWhereImagesNeedToBeOptimized: trpc.procedure.query(() =>
      DB.getPostsWhereImagesNeedToBeOptimized()
    ),
    updatePostImageProcessingStatus: trpc.procedure
      .input(
        z.object({
          feedDomain: feedDomainZSchema,
          postId: z.string().min(2),
          postDataUpdates: z.object({
            postId: z.string().min(2),
            postMediaImagesHaveBeenProcessed: z.boolean(),
            postMediaImagesProcessingError: z.string().optional(),
          }),
        })
      )
      .mutation(({ input }) => DB.updatePostData(input.feedDomain, input.postId, input.postDataUpdates)),
    updatePostDownloadInfoOnSuccess: trpc.procedure
      .input(
        z.object({
          feedDomain: feedDomainZSchema,
          postId: z.string().min(2),
          postDataUpdates: z.object({
            mediaHasBeenDownloaded: z.literal(true),
            couldNotDownload: z.literal(false),
            downloadedMedia: z.array(z.string()),
            downloadedMediaCount: z.number().gt(-1),
          }),
        })
      )
      .mutation(({ input }) => DB.updatePostData(input.feedDomain, input.postId, input.postDataUpdates)),
    updatePostDownloadInfoOnError: trpc.procedure
      .input(
        z.object({
          feedDomain: feedDomainZSchema,
          postId: z.string().min(2),
          postDataUpdates: z.object({
            postId: z.string().min(2),
            mediaHasBeenDownloaded: z.literal(false),
            couldNotDownload: z.literal(true),
            downloadError: z.string(),
            mediaDownloadTries: z.number().gt(-1),
          }),
        })
      )
      .mutation(({ input }) => DB.updatePostData(input.feedDomain, input.postId, input.postDataUpdates)),
    batchAddPosts: trpc.procedure
      .input(incomingPostsZodSchema)
      .mutation(({ input }) => DB.batchAddPosts(input.posts, input.feedDomain, input.feedName)),
  })

export { postRoutes }
