import path from 'path'

import {
  Kysely,
  sql,
  SqliteDialect,
  compileQuery,
  type Selection,
  type From,
  type Selectable,
  SqliteQueryCompiler,
} from 'kysely'
import Sqlite3Database from 'better-sqlite3'
import { nullable } from 'pratica'
import { F } from '@mobily/ts-belt'
import type { MarkRequired } from 'ts-essentials'

import { getEnvFilePath, isDev, mainDBName } from './utils'
import { autoCastValuesToFromDB } from './dbValueCasting'
import type { Post } from './Entities/Post'
import type { Log } from './Entities/Log'
import type { Settings } from './Entities/Settings'
import { EE } from './events'
import type { Subreddit } from './Entities/Subreddit'
import type { Database } from './Entities/AllDBTableTypes'

const enableDBLogging = process.env['LOG_DB_QUERIES'] === 'true'

const ridoDBFilePath = path.join(getEnvFilePath(process.env['DATA_FOLDER']), `${mainDBName()}.db`)

// const ridoDB = knex({
//   client: 'sqlite3',
//   connection: { filename: ridoDBFilePath },
//   debug: enableDBLogging,
//   asyncStackTraces: isDev(),
//   // This is mostly to silence knex warning. We set defaults in the .sql files.
//   useNullAsDefault: true,
//   pool: {
//     // https://github.com/knex/knex/issues/453
//     afterCreate(conn: { readonly run: (sql: string, cb: () => void) => void }, cb: () => void) {
//       conn.run('PRAGMA foreign_keys = ON', cb)
//     },
//   },
// })

const ridoDB = new Kysely<Database>({
  // Use MysqlDialect for MySQL and SqliteDialect for SQLite.
  dialect: new SqliteDialect({
    database: new Sqlite3Database(ridoDBFilePath),
    //TODO:
    // onCreateConnection: (conn): Promise<void> =>
    // conn.executeQuery(new SqliteQueryCompiler().compileQuery(sql`PRAGMA foreign_keys = ON`)).then(F.ignore),
  }),
})

const settingsColumnsToReturn = [
  'number_media_downloads_at_once',
  'number_images_process_at_once',
  'update_all_day',
  'update_starting_hour',
  'update_ending_hour',
  'image_compression_quality',
  'archive_image_compression_quality',
  'max_image_width_for_non_archive_image',
  'has_seen_welcome_message',
] as const

/*****
  NOTE: return a Maybe (nullable) if its a read query for a single item
*****/
/* eslint-disable @typescript-eslint/explicit-function-return-type */
class DBMethods {
  constructor() {
    return autoCastValuesToFromDB(this)
  }

  readonly close = ridoDB.destroy

  getSettings() {
    return (
      ridoDB
        .selectFrom('Settings')
        .select(settingsColumnsToReturn)
        .where('Settings.unique_id', '=', 'settings')
        .executeTakeFirst()
        // dont need Maybe here as settings will always be there
        .then(settings => settings as Settings)
    )
  }

  updateSettings(setting: Partial<Settings>) {
    return ridoDB
      .updateTable('Settings')
      .set(setting)
      .where('unique_id', '=', 'settings')
      .returning(settingsColumnsToReturn)
      .executeTakeFirst()
      .then(updatedSettings => {
        if (!updatedSettings) return
        EE.emit('settingsUpdate', updatedSettings)
      })
  }

  saveLog(log: Log) {
    return ridoDB.insertInto('Log').values(log).execute().then(F.ignore)
  }

  getAllPosts() {
    return ridoDB.selectFrom('Post').selectAll().execute()
  }

  getSinglePost(post_id: Post['post_id']) {
    return ridoDB
      .selectFrom('Post')
      .selectAll()
      .where('post_id', '=', post_id)
      .executeTakeFirst()
      .then(nullable)
  }

  addPost(post: Post) {
    return ridoDB.insertInto('Post').values(post).execute().then(F.ignore)
  }

  batchAddPosts(posts: readonly Post[]) {
    return ridoDB.insertInto('Post').values(posts).execute().then(F.ignore)
  }

  fetchAllPostIds() {
    return ridoDB
      .selectFrom('Post')
      .select('post_id')
      .execute()
      .then(results => results.map(result => result.post_id))
  }

  getPostsThatNeedMediaToBeDownloaded() {
    return ridoDB
      .selectFrom('Post')
      .select(['post_id', 'media_url', 'media_download_tries'])
      .where('media_has_been_downloaded', '=', false)
      .where('could_not_download', '=', false)
      .execute()
  }

  updatePostInfo(postDataUpdates: MarkRequired<Partial<Post>, 'post_id'>) {
    return ridoDB
      .updateTable('Post')
      .where('post_id', '=', postDataUpdates.post_id)
      .set(postDataUpdates)
      .execute()
      .then(F.ignore)
  }

  addSubreddit(subreddit: Subreddit) {
    return ridoDB.insertInto('Subreddit').values(subreddit).execute().then(F.ignore)
  }

  getSubsThatNeedToBeUpdated() {
    const oneHourInMillisecs = 3_600_000
    const anHourAgo = (): number => Date.now() - oneHourInMillisecs
    return ridoDB.selectFrom('Subreddit').selectAll().where('last_updated', '<', anHourAgo()).execute()
  }

  updateSubredditLastUpdatedTimeToNow(subreddit: Subreddit['subreddit']) {
    return ridoDB
      .updateTable('Subreddit')
      .where('subreddit', '=', subreddit)
      .set({ last_updated: Date.now() })
      .execute()
      .then(F.ignore)
  }
}
/* eslint-enable @typescript-eslint/explicit-function-return-type */

const DB = new DBMethods()

type DBInstanceType = typeof DB

// eslint-disable-next-line max-lines-per-function
const thing = (): void => {
  // console.log(DB.thing2())
  // DB.getAllPosts()
  DB.getSinglePost('asd')
    //   // DB.addPost({
    //   //   post_id: 'asd',
    //   //   could_not_download: false,
    //   //   downloaded_media: ['asd.png'],
    //   //   downloaded_media_count: 0,
    //   //   media_download_tries: 0,
    //   //   media_has_been_downloaded: false,
    //   //   media_url: 'http://asd.com',
    //   //   post_media_images_have_been_processed: false,
    //   //   post_thumbnails_created: false,
    //   //   post_url: 'http://xcv.com',
    //   //   score: 2,
    //   //   subreddit: 'merp',
    //   //   timestamp: 3,
    //   //   title: 'hello',
    //   // })
    .then(result => {
      result.cata({
        Just: data => console.log('got data', data),
        Nothing: () => console.log('hit Nothing'),
      })

      console.log('finished db')
    })
    .catch(err => {
      console.log('caught in catch:')
      console.error(err)
    })
}

export { thing, DB }
export type { DBInstanceType }
