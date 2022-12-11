import { DB } from '../db'
// import { SettingsZSchema } from '../Entities/ZodSchemas'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const settingsRoutes = () =>
  trpc.router({
    get: trpc.procedure.query(() => DB.getSettings()),
    // update: trpc.procedure
    //   .input(SettingsZSchema)
    //   .mutation(({ input: setting }) => DB.updateSettings(setting)),
  })

export { settingsRoutes }
