import { DB } from '../db'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const cleanupRoutes = () =>
  trpc.router({
    fetchAllPostIds: trpc.procedure.query(() => DB.fetchAllPostIds()),
  })

export { cleanupRoutes }
