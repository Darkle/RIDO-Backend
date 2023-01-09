import { z } from 'zod'

import { DB } from '../db/db'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-lines-per-function
const subredditRoutes = () =>
  trpc.router({
    getSingleSubreddit: trpc.procedure
      .input(z.object({ subreddit: z.string().min(2) }))
      .query(({ input }) => DB.getSingleFeed(input)),
    getAllSubreddits: trpc.procedure.query(() => DB.getAllFeeds()),
    getFavouriteSubreddits: trpc.procedure.query(() => DB.getFavouriteFeeds()),
    getSubsThatNeedToBeUpdated: trpc.procedure.query(() => DB.getFeedsThatNeedToBeUpdated()),
    updateSubredditLastUpdatedTime: trpc.procedure
      .input(z.object({ subreddit: z.string().min(1) }))
      .mutation(({ input }) => DB.updateFeedLastUpdatedTimeToNow(input.subreddit)),
  })

export { subredditRoutes }
