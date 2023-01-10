import { DB } from '../db/db'
import { logSearchZodSchema, incomingLogZodSchema } from '../ZodSchemas'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const logRoutes = () =>
  trpc.router({
    saveLog: trpc.procedure.input(incomingLogZodSchema).mutation(({ input: log }) => DB.saveLog(log)),
    // eslint-disable-next-line complexity
    searchLogs: trpc.procedure.input(logSearchZodSchema).query(({ input }) => {
      if (input.logLevelFilter === 'all' && input.searchQuery) {
        return DB.findLogs_AllLevels_WithSearch_Paginated(input.page, input.limit, input.searchQuery)
      }

      if (input.logLevelFilter !== 'all' && !input.searchQuery) {
        return DB.findLogs_LevelFilter_NoSearch_Paginated(input.page, input.limit, input.logLevelFilter)
      }

      if (input.logLevelFilter !== 'all' && input.searchQuery) {
        return DB.findLogs_LevelFilter_WithSearch_Paginated(
          input.page,
          input.limit,
          input.searchQuery,
          input.logLevelFilter
        )
      }

      return DB.getAllLogs_Paginated(input.page, input.limit)
    }),
  })

export { logRoutes }
