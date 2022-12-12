import { z } from 'zod'

import { DB } from '../db'
import { LogZSchema } from '../Entities/ZodSchemas'
import { trpc } from '../api'

const defaultSearchResultLimit = 100

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const logRoutes = () =>
  trpc.router({
    saveLog: trpc.procedure.input(LogZSchema).mutation(({ input: log }) => DB.saveLog(log)),
    // searchLogs: trpc.procedure
    //   .input(
    //     z.object({
    //       page: z.number().default(1),
    //       limit: z.number().optional().default(defaultSearchResultLimit),
    //       searchQuery: z.string().optional(),
    //       logLevelFilter: z.enum(['error', 'warn', 'info', 'debug', 'trace']).optional(),
    //     })
    //   )
    //   .query(() => DB.getPostsWhereImagesNeedToBeOptimized()),
  })

export { logRoutes }
