import { DB } from '../db'
import { SettingsZSchema } from '../Entities/ZodSchemas'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const settingsRoutes = () =>
  trpc.router({
    update: trpc.procedure
      .input(SettingsZSchema)
      .mutation(({ input: setting }) => DB.updateSettings(setting)),
  })

export { settingsRoutes }
