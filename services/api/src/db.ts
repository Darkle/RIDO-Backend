import path from 'path'

import knex from 'knex'

import { getEnvFilePath, isDev, mainDBName } from './utils'
import { castValuesForDB, dbInputValCasting, dbOutputValCasting } from './dbValueCasting'
// import type { Subreddit } from './Entities/Subreddit'
// import type { Log } from './Entities/Log'
// import type { TraceLog } from './Entities/TraceLog'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { Post } from './Entities/Post'
// import type { Settings } from './Entities/Settings'
// import type { SubGroup } from './Entities/SubGroup'
// import type { Tag } from './Entities/Tag'
// import type { Subreddit_Post } from './Entities/Subreddit_Post'
// import type { Subreddit_SubGroup } from './Entities/Subreddit_SubGroup'
// import type { Tag_Post } from './Entities/Tag_Post'

const enableDBLogging = process.env['LOG_DB_QUERIES'] === 'true'

const ridoDBFilePath = path.join(getEnvFilePath(process.env['DATA_FOLDER']), `${mainDBName()}.db`)

const ridoDB = knex({
  client: 'sqlite3',
  connection: { filename: ridoDBFilePath },
  debug: enableDBLogging,
  asyncStackTraces: isDev(),
  postProcessResponse: dbOutputValCasting,
  // This is mostly to silence knex warning. We set defaults in the .sql files.
  useNullAsDefault: true,
  pool: {
    // https://github.com/knex/knex/issues/453
    afterCreate(conn: { readonly run: (sql: string, cb: () => void) => void }, cb: () => void) {
      conn.run('PRAGMA foreign_keys = ON', cb)
    },
  },
})

// class DB {
//   constructor() {
//     const handler = {
//       get: (obj, prop) =>
//         typeof obj[prop] !== 'function'
//           ? obj[prop]
//           : (...args) => {
//             console.log('args', args)

//               obj[prop].apply(obj, obj.middleware(args))
//             },
//     }
//     return new Proxy(this, handler)
//   }

//   middleware(...args): number {
//     args[0] = 9
//     console.log(`Executing function ${args[0]}`)
//     return args
//   }

//   getAllLogs(arg: number): void {}

//   getAllPosts(arg: number): void {
//     console.log('inside getAllPosts, the arg is now:', arg)
//   }
// }

// const db = new DB()

// console.log(db.getAllPosts(2))



//TODO: change to static if can
class DB {
  @castValuesForDB()
  getAllLogs(arg: number): void {}

  @castValuesForDB()
  getAllPosts(thing: Post): void {
    console.log('inside getAllPosts, the arg is now:', thing)
  }
}

const db = new DB()
//TODO: also check it with arrays.
console.log(
  db.getAllPosts({
    post_id: 'asd',
    could_not_download: false,
    downloaded_media: ['asd.png'],
    downloaded_media_count: 0,
    media_download_tries: 0,
    media_has_been_downloaded: false,
    media_url: 'http://asd.com',
    post_media_images_have_been_processed: false,
    post_thumbnails_created: false,
    post_url: 'http://xcv.com',
    score: 2,
    subreddit: 'merp',
    timestamp: 3,
    title: 'hello',
  })
)

// eslint-disable-next-line max-lines-per-function
const thing = () => new Promise<void>(resolve => resolve)
// ridoDB<Subreddit>('Subreddit')
//   .where('subreddit', 'Slaughterhouse Five')
//   .first()
//   .then(result => console.log(result))
//   .catch(err => console.error(err))
// ridoDB<Subreddit>('Subreddit')
// .insert({ subreddit: 'merp' })
// .then(result => console.log(result))
// .catch(err => console.error(err))
// .then(() =>
// ridoDB<PostForReadyForDB>('Post')
//   .insert({
//     post_id: 'asd',
//     could_not_download: false,
//     downloaded_media: JSON.stringify(['asd.png']),
//     downloaded_media_count: 0,
//     media_download_tries: 0,
//     media_has_been_downloaded: false,
//     media_url: 'http://asd.com',
//     post_media_images_have_been_processed: false,
//     post_thumbnails_created: false,
//     post_url: 'http://xcv.com',
//     score: 2,
//     subreddit: 'merp',
//     timestamp: 3,
//     title: 'hello',
//   })
//   .then(result => console.log(result))
//   .catch(err => console.error(err))
// )
// ridoDB<Post>('Post')
//   .where('post_id', 'asd')
//   .first()
//   .then(result => console.log(result))
//   .catch(err => console.error(err))

// ridoDB
//   .raw('PRAGMA foreign_keys')
//   .then(result => console.log(result))
//   .catch(err => console.error(err))

// const thing = (): Promise<InsertResult> =>
//   DB.insertInto('Subreddit')
//     .values({ favourited: castBoolToSqliteBool(false), subreddit: 'merp', lastUpdated: 1 })
//     .executeTakeFirst()

export { thing, DB }
