import { z } from 'zod'

import { DB } from '../db'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-lines-per-function
const subredditRoutes = () =>
  trpc.router({
    getSingleSubreddit: trpc.procedure
      .input(z.object({ subreddit: z.string().min(2) }))
      .query(({ input }) => DB.getSingleSubreddit(input)),
    getAllSubreddits: trpc.procedure.query(() => DB.getAllSubreddits()),
    getFavouriteSubreddits: trpc.procedure.query(() => DB.getFavouriteSubreddits()),
    getSubsThatNeedToBeUpdated: trpc.procedure.query(() => DB.getSubsThatNeedToBeUpdated()),
    updateSubredditLastUpdatedTime: trpc.procedure
      .input(z.object({ subreddit: z.string().min(1) }))
      .mutation(({ input }) => DB.updateSubredditLastUpdatedTimeToNow(input.subreddit)),
  })

export { subredditRoutes }
