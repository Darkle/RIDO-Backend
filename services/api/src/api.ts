import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

import { Logger } from './logger'
import { logRoutes } from './routes/log-routes'
import { initStaticFileServer } from './static-file-server'

initStaticFileServer()

const trpc = initTRPC.create({ transformer: superjson })

const appRouter = trpc.router({
  healthcheck: trpc.procedure.query(() => ({
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
  })),
  log: logRoutes(),
})

const trpcRouterCaller = appRouter.createCaller({})

createHTTPServer({
  router: appRouter,
  createContext() {
    return {}
  },
}).listen(Number(process.env['API_SERVICE_PORT']))

Logger.error('text before error arg', new Error('this is new error'))
Logger.info('this is info log1', { extra: { foo: 'bar' } })
Logger.warn('this is a warn log')
Logger.info('this is info log2')
Logger.error('text before error arg 2', new Error('this is new error 2'), { thing: { merp: 'derp' } })

type AppRouter = typeof appRouter

export { appRouter, trpc, trpcRouterCaller }
export type { AppRouter }
