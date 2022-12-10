import { DB } from '../db'
import { LogZSchema } from '../Entities/ZodSchemas'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const logRoutes = () =>
  trpc.router({
    saveLog: trpc.procedure.input(LogZSchema).mutation(({ input: log }) => DB.saveLog(log)),
  })

export { logRoutes }
