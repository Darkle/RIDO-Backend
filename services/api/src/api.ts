import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { onShutdown } from 'node-graceful-shutdown'

import { logRoutes } from './routes/log-routes'
import { initStaticFileServer } from './static-file-server'
import { settingsRoutes } from './routes/settings-routes'
import { DB } from './db'
import { startSubscriptionsServer } from './routes/sse-subscriptions'
import { postRoutes } from './routes/post-routes'
import { subredditRoutes } from './routes/subreddit-routes'
import { tagRoutes } from './routes/tag-routes'
import { subredditGroupRoutes } from './routes/subreddit-group-routes'

initStaticFileServer()

const apiPort = Number(process.env['API_SERVICE_PORT'])

const trpc = initTRPC.create({ transformer: superjson })

const appRouter = trpc.router({
  healthcheck: trpc.procedure.query(() => ({
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
  })),
  settings: settingsRoutes(),
  log: logRoutes(),
  post: postRoutes(),
  subreddit: subredditRoutes(),
  subredditGroup: subredditGroupRoutes(),
  tag: tagRoutes(),
})

const trpcRouterCaller = appRouter.createCaller({})

createHTTPServer({ router: appRouter }).listen(apiPort)

onShutdown('api-service', () => DB.close())

console.log(`API Running on port ${apiPort} `)

startSubscriptionsServer().catch(err => console.error(err))

// thing().catch(err => console.error(err))

// Logger.error('this is an error', new Error('new error'))

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-magic-numbers
// ;[...Array(130)].forEach((_, idx) => Logger.info(`thing-${idx}`))
// ;[...Array(130)].forEach((_, idx) => Logger.info(`cat-${idx}`))
// ;[...Array(130)].forEach((_, idx) => Logger.info(`dog-${idx}`))

trpcRouterCaller.log
  .searchLogs({ page: 1, logLevelFilter: 'error', searchQuery: 'foobar' })
  //   .updateSubredditLastUpdatedTime({ subreddit: 'merp' })
  //   // trpcRouterCaller.download
  //   //   .updatePostDownloadInfoOnError({
  //   //     postId: 'asd-1',
  //   //     mediaHasBeenDownloaded: false,
  //   //     couldNotDownload: true,
  //   //     downloadError: 'error',
  //   //     mediaDownloadTries: 1,
  //   //   })
  .then(results => console.log(results))
  //   // .then(() => trpcRouterCaller.settings.update({ numberMediaDownloadsAtOnce: 666 }))
  //   // .then(() => trpcRouterCaller.settings.get())
  //   // .then(settings => console.log(settings))
  .catch(err => console.error(err))

// DB.getSettings().then(settings => console.log(settings)).catch(err => console.error(err))

// setTimeout(() => {
//   DB.updateSettings({ numberMediaDownloadsAtOnce: 333 })
//     .then(() => {
//       console.log('finished updating settings')
//     })
//     .catch(err => console.error(err))
// }, 6000)

type AppRouter = typeof appRouter

export { appRouter, trpc, trpcRouterCaller }
export type { AppRouter }
