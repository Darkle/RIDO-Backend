import { z } from 'zod'

import { DB } from '../db'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-lines-per-function
const imageProcessingRoutes = () =>
  trpc.router({
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
  })

export { imageProcessingRoutes }
