import { z } from 'zod'

import { DB } from '../db'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-lines-per-function
const downloadRoutes = () =>
  trpc.router({
    getPostsThatNeedMediaToBeDownloaded: trpc.procedure.query(() => DB.getPostsThatNeedMediaToBeDownloaded()),
    updatePostDownloadInfoOnSuccess: trpc.procedure
      .input(
        z.object({
          post_id: z.string().min(2),
          media_has_been_downloaded: z.boolean(),
          could_not_download: z.boolean(),
          downloaded_media: z.array(z.string()),
          downloaded_media_count: z.number().gt(-1),
        })
      )
      .mutation(({ input }) => DB.updatePostInfo(input)),
    updatePostDownloadInfoOnError: trpc.procedure
      .input(
        z.object({
          post_id: z.string().min(2),
          media_has_been_downloaded: z.boolean(),
          could_not_download: z.boolean(),
          download_error: z.string(),
          media_download_tries: z.number().gt(-1),
        })
      )
      .mutation(({ input }) => DB.updatePostInfo(input)),
  })

export { downloadRoutes }
