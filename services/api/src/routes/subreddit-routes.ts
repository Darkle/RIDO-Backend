import { z } from 'zod'

import { DB } from '../db'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-lines-per-function
const subredditRoutes = () =>
  trpc.router({
    getSubsThatNeedToBeUpdated: trpc.procedure.query(() => DB.getSubsThatNeedToBeUpdated()),
    updateSubredditLastUpdatedTime: trpc.procedure
      .input(z.object({ subreddit: z.string().min(1) }))
      .mutation(({ input }) => DB.updateSubredditLastUpdatedTimeToNow(input.subreddit)),
  })

export { subredditRoutes }
