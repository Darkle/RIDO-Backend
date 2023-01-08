// import { createHTTPServer } from '@trpc/server/adapters/standalone'
// import { initTRPC } from '@trpc/server'
// import superjson from 'superjson'
// import { onShutdown } from 'node-graceful-shutdown'

// import { logRoutes } from './routes/log-routes'
// import { initStaticFileServer } from './static-file-server'
// import { settingsRoutes } from './routes/settings-routes'
import { DB } from './db'
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

// onShutdown('api-service', () => DB.close().catch(err => {
//   console.error(err)
// }))

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

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const randomPosts = Array.from({ length: 20 }).map((_, idx) => ({
  postId: `post-id${idx}`,
  feedDomain: 'reddit.com',
  title: 'post-title',
  postUrl: 'http://foo.com',
  score: idx,
  timestamp: new Date(),
  mediaUrl: 'http://media.com',
}))

setTimeout(() => {
  // DB.batchAddPosts(randomPosts, 'reddit.com', 'aww')
  // DB.getSinglePostWithItsFeedAttatched('reddit.com', `post-id1`)
    DB.addTag('myFavs')
    // DB.getSettings()
    // DB.getSingleFeed('aww', 'reddit.com')
    //   // DB.addPost({
    //   //   postId: `asthe7`,
    //   //   feedDomain: `reddit.com`,
    //   //   feedId: 'aww',
    //   //   title: 'title of thing',
    //   //   postUrl: 'http://asd.com',
    //   //   score: 33,
    //   //   timestamp: 333443,
    //   //   mediaUrl: 'htt://pm.asd',
    //   // })
    //   DB.addFeed('aww', 'reddit.com')
    //     // DB.getPostsThatNeedMediaToBeDownloaded()
    //     // DB.batchAddPosts(
    //     //   Array.from({ length: 200 }).map((_, idx) => ({
    //     //     postId: `foo-${idx}`,
    //     //     feedDomain: `reddit.com`,
    //     //     feedId: 'aww',
    //     //     title: 'title of thing',
    //     //     postUrl: 'http://asd.com',
    //     //     score: idx,
    //     //     timestamp: 1 + idx,
    //     //     mediaUrl: 'htt://pm.asd',
    //     //   }))
    //     // )
    .then(res => {
      // res.cata({
        // Just: h => console.log(h),
        // Nothing: () => console.log(`no data :-(`),
      // })
      console.log('res', res)
    })
    // .then(() => DB.updateSettings({ numberImagesProcessAtOnce: 333 }))
    // .then(() => DB.getSettings())
    // .then(res => {
    //   // res.cata({
    //   // Just: h => console.log(h),
    //   // Nothing: () => console.log(`no data :-(`),
    //   // })
    //   console.log('res', res)
    // })
    //     // .then(() => DB.addPost({
    //     //       postId: `single-add`,
    //     //       feedDomain: `foo.com`,
    //     //       feedId: 'usurp',
    //     //       title: 'title of thing',
    //     //       postUrl: 'httpasd.com',
    //     //       score: 33,
    //     //       timestamp: 333443,
    //     //       mediaUrl: 'httpm.asd',
    //     //       mediaHasBeenDownloaded: false,
    //     //       couldNotDownload: false,
    //     //       postMediaImagesHaveBeenProcessed: false,
    //     //       postThumbnailsCreated: false,
    //     //       mediaDownloadTries: 0,
    //     //       downloadedMediaCount: 0,
    //     //     }))
    //     // .then(() =>
    //     //   DB.saveLog({
    //     //     level: 'debug',
    //     //     message: 'chritsmas',
    //     //     service: 'downloads',
    //     //     error: 'no presents',
    //     //     other: { foo: 'guide' },
    //     //   })
    //     // )
    // .then(() =>
    //   DB.batchAddPosts(
    //     // Array.from({ length: 100_000 }).map((_, idx) => ({
    //     // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    //     Array.from({ length: 300 }).map((_, idx) => ({
    //       postId: `foo-${idx}`,
    //       title: 'title of thing',
    //       postUrl: 'http://asd.com',
    //       score: idx,
    //       timestamp: 1 + idx,
    //       mediaUrl: 'https://pm.asd',
    //       mediaHasBeenDownloaded: false,
    //       couldNotDownload: false,
    //       postMediaImagesHaveBeenProcessed: false,
    //       postThumbnailsCreated: false,
    //       mediaDownloadTries: 0,
    //       downloadedMediaCount: 0,
    //     })),
    //     `reddit.com`,
    //     'aww'
    //   )
    // )
    //     // .then(() => DB.getAllLogs_Paginated(1, 2))
    //     // .then(res => {
    //     //   console.log('res', res)
    //     // })
    .catch(err => {
      console.log('in error catch')
      console.error(err)
    })
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
}, 1000)
