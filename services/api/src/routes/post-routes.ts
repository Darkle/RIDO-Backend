import { z } from 'zod'

import { DB } from '../db'
import { trpc } from '../api'
import { IncommingPostZSchema } from '../ZodSchemas'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-lines-per-function
const postRoutes = () =>
  trpc.router({
    fetchAllPostIds: trpc.procedure.query(() => DB.fetchAllPostIds()),
    getPostsThatNeedMediaToBeDownloaded: trpc.procedure.query(() => DB.getPostsThatNeedMediaToBeDownloaded()),
    getPostsWhereImagesNeedToBeOptimized: trpc.procedure.query(() =>
      DB.getPostsWhereImagesNeedToBeOptimized()
    ),
    updatePostImageProcessingStatus: trpc.procedure
      .input(
        z.object({
          postId: z.string().min(2),
          postMediaImagesHaveBeenProcessed: z.boolean(),
          postMediaImagesProcessingError: z.string().optional(),
        })
      )
      .mutation(({ input }) => DB.updatePostInfo(input)),
    updatePostDownloadInfoOnSuccess: trpc.procedure
      .input(
        z.object({
          postId: z.string().min(2),
          mediaHasBeenDownloaded: z.literal(true),
          couldNotDownload: z.literal(false),
          downloadedMedia: z.array(z.string()),
          downloadedMediaCount: z.number().gt(-1),
        })
      )
      .mutation(({ input }) => DB.updatePostInfo(input)),
    updatePostDownloadInfoOnError: trpc.procedure
      .input(
        z.object({
          postId: z.string().min(2),
          mediaHasBeenDownloaded: z.literal(false),
          couldNotDownload: z.literal(true),
          downloadError: z.string(),
          mediaDownloadTries: z.number().gt(-1),
        })
      )
      .mutation(({ input }) => DB.updatePostInfo(input)),
    batchAddPosts: trpc.procedure
      .input(z.array(IncommingPostZSchema))
      .mutation(({ input }) => DB.batchAddPosts(input)),
  })

export { postRoutes }
