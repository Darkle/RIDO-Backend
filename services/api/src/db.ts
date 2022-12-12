import path from 'path'

import { Kysely, sql, SqliteDialect, SqliteQueryCompiler } from 'kysely'
import Sqlite3Database from 'better-sqlite3'
import { nullable } from 'pratica'
import { F } from '@mobily/ts-belt'
import type { MarkRequired } from 'ts-essentials'
import type { Brand } from 'ts-brand'

import { getEnvFilePath, mainDBName } from './utils'
import { autoCastValuesToFromDB, dbOutputValCasting } from './dbValueCasting'
import type { Post, PostTable } from './Entities/Post'
import type { Log } from './Entities/Log'
import type { Settings, SettingsTable } from './Entities/Settings'
import { EE } from './events'
import type { Subreddit } from './Entities/Subreddit'
import type { Database } from './Entities/AllDBTableTypes'

const sqliteOptions = process.env['LOG_DB_QUERIES'] === 'true' ? { verbose: console.log } : {}

const ridoDBFilePath = path.join(getEnvFilePath(process.env['DATA_FOLDER']), `${mainDBName()}.db`)

const enableForeignKeys = new SqliteQueryCompiler().compileQuery(
  sql`PRAGMA foreign_keys = ON`.toOperationNode()
)

const ridoDB = new Kysely<Database>({
  dialect: new SqliteDialect({
    database: new Sqlite3Database(ridoDBFilePath, sqliteOptions),
    onCreateConnection: (conn): Promise<void> => conn.executeQuery(enableForeignKeys).then(F.ignore),
  }),
})

ridoDB.selectFrom('Log').compile()

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

const SQLiteBoolTrue = 1 as Brand<number, 'SQLiteBool'>
const SQLiteBoolFalse = 0 as Brand<number, 'SQLiteBool'>

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
        // dont need Maybe here as settings will always be there
        .executeTakeFirst()
    )
  }

  updateSettings(setting: Partial<SettingsTable>) {
    return ridoDB
      .updateTable('Settings')
      .set(setting)
      .where('unique_id', '=', 'settings')
      .returning(settingsColumnsToReturn)
      .executeTakeFirst()
      .then(updatedSettings => {
        if (!updatedSettings) return
        EE.emit('settingsUpdate', dbOutputValCasting(updatedSettings) as Settings)
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

  addPost(post: PostTable) {
    return ridoDB.insertInto('Post').values(post).execute().then(F.ignore)
  }

  batchAddPosts(posts: readonly PostTable[]) {
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
      .where('media_has_been_downloaded', '=', SQLiteBoolFalse)
      .where('could_not_download', '=', SQLiteBoolFalse)
      .execute()
  }

  getPostsWhereImagesNeedToBeOptimized() {
    return ridoDB
      .selectFrom('Post')
      .selectAll()
      .where('media_has_been_downloaded', '=', SQLiteBoolTrue)
      .where('could_not_download', '=', SQLiteBoolFalse)
      .where('post_media_images_have_been_processed', '=', SQLiteBoolFalse)
      .execute()
  }

  updatePostInfo(postDataUpdates: MarkRequired<Partial<PostTable>, 'post_id'>) {
    return ridoDB
      .updateTable('Post')
      .where('post_id', '=', postDataUpdates.post_id)
      .set(postDataUpdates)
      .execute()
      .then(F.ignore)
  }

  addSubreddit(subreddit: Subreddit['subreddit']) {
    return ridoDB.insertInto('Subreddit').values({ subreddit }).execute().then(F.ignore)
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

let delay = () =>
  new Promise(resolve => {
    setTimeout(resolve)
  })

// eslint-disable-next-line max-lines-per-function
const thing = (): Promise<void | readonly void[]> =>
  // console.log(DB.thing2())
  // DB.getAllPosts()
  DB.addSubreddit('merp')
    // eslint-disable-next-line max-lines-per-function
    .then(() =>
      Promise.all(
        [...Array(30)].map((_, idx) =>
          delay().then(() =>
            DB.addPost({
              post_id: `asd-${idx}`,
              could_not_download: SQLiteBoolFalse,
              downloaded_media: ['asd.png'],
              downloaded_media_count: 0,
              media_download_tries: 0,
              media_has_been_downloaded: SQLiteBoolFalse,
              media_url: 'http://asd.com',
              post_media_images_have_been_processed: SQLiteBoolFalse,
              post_thumbnails_created: SQLiteBoolFalse,
              post_url: 'http://xcv.com',
              score: 2,
              subreddit: 'merp',
              timestamp: Date.now(),
              title: 'hello',
              download_error: null,
              downloaded_media: null,
              post_media_images_processing_Error: null,
            })
          )
        )
      )
    )
    .catch(err => {
      console.log('caught in catch:')
      console.error(err)
    })

export { thing, DB }
export type { DBInstanceType }
