import path from 'path'

import knex from 'knex'

import { getEnvFilePath, isDev, logsDBName, mainDBName } from './utils'
import { dbOutputValCasting } from './dbValueCasting'
import type { Subreddit } from './Entities/Subreddit'
// import type { Log } from './Entities/Log'
// import type { TraceLog } from './Entities/TraceLog'
import type { Post, PostForReadyForDB } from './Entities/Post'
// import type { Settings } from './Entities/Settings'
// import type { SubGroup } from './Entities/SubGroup'
// import type { Tag } from './Entities/Tag'
// import type { Subreddit_Post } from './Entities/Subreddit_Post'
// import type { Subreddit_SubGroup } from './Entities/Subreddit_SubGroup'
// import type { Tag_Post } from './Entities/Tag_Post'

const enableDBLogging = process.env['LOG_DB_QUERIES'] === 'true'

const logsDBFilePath = path.join(getEnvFilePath(process.env['DATA_FOLDER']), `${logsDBName()}.db`)
const ridoDBFilePath = path.join(getEnvFilePath(process.env['DATA_FOLDER']), `${mainDBName()}.db`)

const logsDB = knex({
  client: 'sqlite3',
  connection: { filename: logsDBFilePath },
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

class DB {
  static getAllLogs() {}
  static getAllPosts() {}
}

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
