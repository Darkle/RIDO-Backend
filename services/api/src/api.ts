// import { createHTTPServer } from '@trpc/server/adapters/standalone'
// import { initTRPC } from '@trpc/server'
// import superjson from 'superjson'
// import { onShutdown } from 'node-graceful-shutdown'

// import { logRoutes } from './routes/log-routes'
// import { initStaticFileServer } from './static-file-server'
// import { settingsRoutes } from './routes/settings-routes'
import { DB, thing } from './db'
// import { startSubscriptionsServer } from './routes/sse-subscriptions'
// import { postRoutes } from './routes/post-routes'
// import { subredditRoutes } from './routes/subreddit-routes'
// import { tagRoutes } from './routes/tag-routes'
// import { subredditGroupRoutes } from './routes/subreddit-group-routes'

// initStaticFileServer()

// const apiPort = Number(process.env['API_SERVICE_PORT'])

// const trpc = initTRPC.create({ transformer: superjson })

// const appRouter = trpc.router({
//   healthcheck: trpc.procedure.query(() => ({
//     uptime: process.uptime(),
//     message: 'OK',
//     timestamp: Date.now(),
//   })),
//   settings: settingsRoutes(),
//   log: logRoutes(),
//   post: postRoutes(),
//   subreddit: subredditRoutes(),
//   subredditGroup: subredditGroupRoutes(),
//   tag: tagRoutes(),
// })

// const trpcRouterCaller = appRouter.createCaller({})

// createHTTPServer({ router: appRouter }).listen(apiPort)

// onShutdown('api-service', () => DB.close())

// console.log(`API Running on port ${apiPort} `)

// startSubscriptionsServer().catch(err => console.error(err))

DB.init().catch(err => console.error(err))

// // thing().catch(err => console.error(err))

// // Logger.error('this is an error', new Error('new error'))

// // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-magic-numbers
// // ;[...Array(130)].forEach((_, idx) => Logger.info(`thing-${idx}`))
// // ;[...Array(130)].forEach((_, idx) => Logger.info(`cat-${idx}`))
// // ;[...Array(130)].forEach((_, idx) => Logger.info(`dog-${idx}`))

// trpcRouterCaller.log
//   .searchLogs({ page: 1, logLevelFilter: 'error', searchQuery: 'foobar' })
//   //   .updateSubredditLastUpdatedTime({ subreddit: 'merp' })
//   //   // trpcRouterCaller.download
//   //   //   .updatePostDownloadInfoOnError({
//   //   //     postId: 'asd-1',
//   //   //     mediaHasBeenDownloaded: false,
//   //   //     couldNotDownload: true,
//   //   //     downloadError: 'error',
//   //   //     mediaDownloadTries: 1,
//   //   //   })
//   .then(results => console.log(results))
//   //   // .then(() => trpcRouterCaller.settings.update({ numberMediaDownloadsAtOnce: 666 }))
//   //   // .then(() => trpcRouterCaller.settings.get())
//   //   // .then(settings => console.log(settings))
//   .catch(err => console.error(err))

// // DB.getSettings().then(settings => console.log(settings)).catch(err => console.error(err))

// // setTimeout(() => {
// //   DB.updateSettings({ numberMediaDownloadsAtOnce: 333 })
// //     .then(() => {
// //       console.log('finished updating settings')
// //     })
// //     .catch(err => console.error(err))
// // }, 6000)

// type AppRouter = typeof appRouter

// export { appRouter, trpc, trpcRouterCaller }
// export type { AppRouter }

setTimeout(() => {
  DB.findLogs_LevelFilter_WithSearch_Paginated(1, 100, 'hoot', `error`)
    .then(res => {
      // res.cata({
      //   Just: h => console.log(h),
      //   Nothing: () => console.log(`no data :-(`),
      // })
      console.log('res', res)
    })
    // .then(() =>
    // DB.saveLog({ level: 'debug', message: 'chritsmas', service: 'downloads', error: 'no presents', other: { foo: 'guide' } })
    // )
    // .then(() =>
    //   DB.batchAddPosts([
    //     {
    //       postId: 'foo3',
    //       feed: 'merp3',
    //       feedType: 'derp3',
    //       feedName: 'usurp',
    //       title: 'title of thing',
    //       postUrl: 'httpasd.com',
    //       score: 11,
    //       timestamp: 1,
    //       mediaUrl: 'httpm.asd',
    //       mediaHasBeenDownloaded: false,
    //       couldNotDownload: false,
    //       postMediaImagesHaveBeenProcessed: false,
    //       postThumbnailsCreated: false,
    //       mediaDownloadTries: 0,
    //       downloadedMediaCount: 0,
    //     },
    //     {
    //       postId: 'foo4',
    //       feed: 'merp4',
    //       feedType: 'derp4',
    //       feedName: 'usurp',
    //       title: 'title of thing',
    //       postUrl: 'httpasd.com',
    //       score: 11,
    //       timestamp: 1,
    //       mediaUrl: 'httpm.asd',
    //       mediaHasBeenDownloaded: false,
    //       couldNotDownload: false,
    //       postMediaImagesHaveBeenProcessed: false,
    //       postThumbnailsCreated: false,
    //       mediaDownloadTries: 0,
    //       downloadedMediaCount: 0,
    //     },
    //   ])
    // )
    // .then(() => DB.getAllLogs_Paginated(1, 2))
    // .then(res => {
    //   console.log('res', res)
    // })
    .catch(err => {
      console.log('in error catch')
      console.error(err)
    })
}, 1000)
