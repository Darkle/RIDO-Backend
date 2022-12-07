import path from 'path'

import knex from 'knex'

import { getEnvFilePath, isDev, logsDBName, mainDBName } from './utils'
import type { Subreddit } from './Entities/Subreddit'
import { dbOutputCasting } from './db-output-casting'
// import type { Log } from './Entities/Log'
// import type { TraceLog } from './Entities/TraceLog'
// import type { Post } from './Entities/Post'
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
  postProcessResponse: dbOutputCasting,
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
  postProcessResponse: dbOutputCasting,
  // This is mostly to silence knex warning. We set defaults in the .sql files.
  useNullAsDefault: true,
  pool: {
    // https://github.com/knex/knex/issues/453
    afterCreate(conn: { readonly run: (sql: string, cb: () => void) => void }, cb: () => void) {
      conn.run('PRAGMA foreign_keys = ON', cb)
    },
  },
})

const thing = () =>
  // ridoDB<Subreddit>('Subreddit')
  //   .where('subreddit', 'merp')
  //   .first()
  //   .then(result => console.log(result))
  //   .catch(err => console.error(err))
  ridoDB<Subreddit>('Subreddit')
    .insert({ subreddit: 'Slaughterhouse Five' })
    .then(result => console.log(result))
    .catch(err => console.error(err))

// ridoDB
//   .raw('PRAGMA foreign_keys')
//   .then(result => console.log(result))
//   .catch(err => console.error(err))

// const thing = (): Promise<InsertResult> =>
//   DB.insertInto('Subreddit')
//     .values({ favourited: castBoolToSqliteBool(false), subreddit: 'merp', lastUpdated: 1 })
//     .executeTakeFirst()

export { thing }
