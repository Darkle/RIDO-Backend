import { initTRPC } from '@trpc/server'
import { createHTTPServer } from '@trpc/server/adapters/standalone'

import { initStaticFileServer } from './static-file-server'

initStaticFileServer()

const t = initTRPC.create()

const appRouter = t.router({
  healthcheck: t.procedure.query(() => ({
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
  })),
})

createHTTPServer({
  router: appRouter,
  createContext() {
    return {}
  },
}).listen(Number(process.env['API_SERVICE_PORT']))

type AppRouter = typeof appRouter

export {}
export type { AppRouter }
