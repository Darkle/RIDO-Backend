import { z } from 'zod'

import { DB } from '../db'
import { trpc } from '../api'
import { PostZSchema } from '../Entities/ZodSchemas'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-lines-per-function
const updateRoutes = () =>
  trpc.router({
    getSubsThatNeedToBeUpdated: trpc.procedure.query(() => DB.getSubsThatNeedToBeUpdated()),
    batchAddPosts: trpc.procedure
      .input(z.array(PostZSchema))
      .mutation(({ input }) => DB.batchAddPosts(input)),
    updateSubredditLastUpdatedTime: trpc.procedure
      .input(z.object({ subreddit: z.string().min(1) }))
      .mutation(({ input }) => DB.updateSubredditLastUpdatedTimeToNow(input.subreddit)),
  })

export { updateRoutes }
