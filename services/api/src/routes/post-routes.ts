import { z } from 'zod'

import { DB } from '../db'
import { trpc } from '../api'
import { PostZSchema } from '../Entities/ZodSchemas'

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
          post_id: z.string().min(2),
          post_media_images_have_been_processed: z.boolean(),
          post_media_images_processing_Error: z.string().optional(),
        })
      )
      .mutation(({ input }) => DB.updatePostInfo(input)),
    updatePostDownloadInfoOnSuccess: trpc.procedure
      .input(
        z.object({
          post_id: z.string().min(2),
          media_has_been_downloaded: z.literal(true),
          could_not_download: z.literal(false),
          downloaded_media: z.array(z.string()),
          downloaded_media_count: z.number().gt(-1),
        })
      )
      .mutation(({ input }) => DB.updatePostInfo(input)),
    updatePostDownloadInfoOnError: trpc.procedure
      .input(
        z.object({
          post_id: z.string().min(2),
          media_has_been_downloaded: z.literal(false),
          could_not_download: z.literal(true),
          download_error: z.string(),
          media_download_tries: z.number().gt(-1),
        })
      )
      .mutation(({ input }) => DB.updatePostInfo(input)),
    batchAddPosts: trpc.procedure
      .input(z.array(PostZSchema))
      .mutation(({ input }) => DB.batchAddPosts(input)),
  })

export { postRoutes }
