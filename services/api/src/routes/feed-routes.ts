// import { z } from 'zod'

import { DB } from '../db/db'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const feedRoutes = () =>
  trpc.router({
    // getSingleFeed: trpc.procedure
    //   .input(z.object({ subreddit: z.string().min(2) }))
    //   .query(({ input }) => DB.getSingleFeed(input)),
    getAllFeeds: trpc.procedure.query(() => DB.getAllFeeds()),
    getFavouriteFeeds: trpc.procedure.query(() => DB.getFavouriteFeeds()),
    getFeedsThatNeedToBeUpdated: trpc.procedure.query(() => DB.getFeedsThatNeedToBeUpdated()),
    // getAllFeedTags: trpc.procedure.query(() => DB.getAllFeedTags()),
    // getSingleFeedTag: trpc.procedure
    //   .input(z.object({ subGroup: z.string().min(2) }))
    //   .query(({ input }) => DB.getSingleSubredditGroup(input)),
    // getFavouriteFeedsGroups: trpc.procedure.query(() => DB.getFavouriteSubredditGroups()),
    // updateFeedLastUpdatedTime: trpc.procedure
    //   .input(z.object({ subreddit: z.string().min(1) }))
    //   .mutation(({ input }) => DB.updateFeedLastUpdatedTimeToNow(input.subreddit)),
  })

export { feedRoutes }
