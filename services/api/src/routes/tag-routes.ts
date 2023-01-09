import { z } from 'zod'

import { DB } from '../db/db'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-lines-per-function
const tagRoutes = () =>
  trpc.router({
    getAllTags: trpc.procedure.query(() => DB.getAllTags()),
    getSingleTag: trpc.procedure
      .input(z.object({ tag: z.string().min(2) }))
      .query(({ input }) => DB.getSingleTag(input)),
    getFavouriteTags: trpc.procedure.query(() => DB.getFavouriteTags()),
  })

export { tagRoutes }
