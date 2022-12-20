import { z } from 'zod'

import { DB } from '../db'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-lines-per-function
const subredditGroupRoutes = () =>
  trpc.router({
    getAllSubredditGroups: trpc.procedure.query(() => DB.getAllFeedTags()),
    getSingleSubredditGroup: trpc.procedure
      .input(z.object({ subGroup: z.string().min(2) }))
      .query(({ input }) => DB.getSingleSubredditGroup(input)),
    getFavouriteSubredditGroups: trpc.procedure.query(() => DB.getFavouriteSubredditGroups()),
  })

export { subredditGroupRoutes }
