import path from 'path'

import { Kysely, sql, SqliteDialect, SqliteQueryCompiler } from 'kysely'
import Sqlite3Database from 'better-sqlite3'
import { nullable } from 'pratica'
import { F } from '@mobily/ts-belt'
import type { MarkRequired } from 'ts-essentials'

import { getEnvFilePath, mainDBName } from './utils'
import { autoCastValuesToFromDB, dbOutputValCasting } from './dbValueCasting'
import type { Post } from './Entities/Post'
import type { Log } from './Entities/Log'
import type { Settings } from './Entities/Settings'
import { EE } from './events'
import type { Subreddit } from './Entities/Subreddit'
import type { Database } from './Entities/AllDBTableTypes'
import type { logSearchZSchema } from './Entities/ZodSchemas'
import type { z } from 'zod'

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

// @ts-expect-error We are lying to Typescript here so the orm doesnt complain. Booleans need to be ints for sqlite.
const SQLiteBoolTrue = 1 as boolean
// @ts-expect-error We are lying to Typescript here so the orm doesnt complain. Booleans need to be ints for sqlite.
const SQLiteBoolFalse = 0 as boolean

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
    return (
      ridoDB
        .updateTable('Settings')
        .set(setting)
        .where('unique_id', '=', 'settings')
        .returning(settingsColumnsToReturn)
        .executeTakeFirst()
        // because we are doing some thing here in the db method, the normal dbOutputValCasting would not be run untill after the EE.emit, do need to call manually
        .then(updatedSettings => dbOutputValCasting(updatedSettings) as Settings)
        .then((updatedSettings: Settings) => {
          EE.emit('settingsUpdate', updatedSettings)
        })
    )
  }

  saveLog(log: Log) {
    return ridoDB.insertInto('Log').values(log).execute().then(F.ignore)
  }

  /*****
    no level filter with no search
    no level filter with search
    level filter with search
    level filter with no search
  *****/

  // findLogs_AllLevels_NoSearch_Paginated() {}
  // findLogs_AllLevels_WithSearch_Paginated() {}
  // findLogs_LevelFilter_WithSearch_Paginated() {}
  // findLogs_LevelFilter_NoSearch_Paginated() {}

  // eslint-disable-next-line max-lines-per-function,complexity
  findLogs_Paginated({ page, limit, searchQuery, logLevelFilter }: z.infer<typeof logSearchZSchema>) {
    //TODO:return total count too
    //TODO: check level filter too - only checked all atm
    const skip = page === 1 ? 0 : (page - 1) * limit
    // const levelWhere = logLevelFilter === 'all' ? '' : `WHERE "level" = ${logLevelFilter}`
    // const searchWhere = !searchQuery
    //   ? ''
    //   : `WHERE "message" LIKE %${searchQuery as string}% OR WHERE "service" LIKE %${
    //       searchQuery as string
    //     }% or WHERE "error" LIKE %${searchQuery as string} or WHERE "misc_data" LIKE %${
    //       searchQuery as string
    //     }%`
    // const whereClauses =
    //   logLevelFilter === 'all' ? ` ${searchWhere}` : searchWhere.length ?`${levelWhere} AND (${searchWhere})`

    // console.log('whereClauses', whereClauses)
    // ridoDB.selectFrom('Log').select(thing => sql<
    //   readonly Log[]
    // >`select * from Log ${levelWhere} ${searchWhere} LIMIT ${limit} OFFSET ${skip} ORDER BY created_at DESC`)

    // return sql<
    //   readonly Log[]
    // >`select * from Log ${levelWhere} ${searchWhere} LIMIT ${limit} OFFSET ${skip} ORDER BY created_at DESC`.execute(ridoDB)
    // console.log('levelWhere', levelWhere)
    // console.log('searchWhere', searchWhere)
    // console.log('limit', limit)
    // console.log('skip', skip)
    // console.log(
    //   sql<
    //     readonly Log[]
    //   >`select * from Log ${levelWhere} ${searchWhere} LIMIT ${limit} OFFSET ${skip} ORDER BY created_at DESC`.toString()
    // )

    // const sqlString = whereClauses.length
    //   ? sql<
    //       readonly Log[]
    //     >`select * from "Log" ${whereClauses} ORDER BY "created_at" DESC LIMIT ${limit} OFFSET ${skip}`
    //   : sql<readonly Log[]>`select * from "Log" ORDER BY "created_at" DESC LIMIT ${limit} OFFSET ${skip}`

    // console.log('sqlString', sqlString)
    // return sqlString.execute(ridoDB)
    // return (
    //   ridoDB
    //     .selectFrom('Log')
    //     .selectAll()
    //     .offset(skip)
    //     // .where('level', '=', 'info')
    //     .orWhere('message', 'like', `%foobar%`)
    //     .orWhere('service', 'like', `%foobar%`)
    //     .orWhere('error', 'like', `%foobar%`)
    //     .orWhere('misc_data', 'like', `%foobar%`)
    //     .limit(limit)
    //     .orderBy('created_at', 'desc')
    //     .execute()
    // )
    // eslint-disable-next-line functional/no-let,prefer-const
    // let query = sql<
    //   readonly Log[]
    // >`select * from "Log" ORDER BY "created_at" DESC LIMIT ${limit} OFFSET ${skip}`

    // // eslint-disable-next-line functional/no-conditional-statement
    // if (logLevelFilter === 'all' && searchQuery) {
    //   query = sql<
    //     readonly Log[]
    //   >`select * from "Log" WHERE "message" LIKE %${searchQuery}% OR WHERE "service" LIKE %${searchQuery}% or WHERE "error" LIKE %${searchQuery} or WHERE "misc_data" LIKE %${searchQuery}% ORDER BY "created_at" DESC LIMIT ${limit} OFFSET ${skip}`
    // }

    // // eslint-disable-next-line functional/no-conditional-statement
    // if (logLevelFilter !== 'all' && !searchQuery) {
    //   query = sql<
    //     readonly Log[]
    //   >`select * from "Log" ORDER BY "created_at" DESC LIMIT ${limit} OFFSET ${skip}`
    // }

    // // eslint-disable-next-line functional/no-conditional-statement
    // if (logLevelFilter !== 'all' && searchQuery) {
    //   return DB.findLogs_LevelFilter_WithSearch_Paginated(
    //     input.page,
    //     input.limit,
    //     input.searchQuery,
    //     input.logLevelFilter
    //   )
    // }

    // return query.execute(ridoDB)

    const isSearchTerm = !!searchQuery

    return ridoDB
      .selectFrom('Log')
      .selectAll()
      .offset(skip)
      .limit(limit)
      .if(logLevelFilter !== 'all', qb =>
        qb.where('level', '=', logLevelFilter as Exclude<typeof logLevelFilter, 'all'>)
      )
      .if(isSearchTerm, qb => qb.where('message', 'like', `%${searchQuery as string}%`))
      .if(isSearchTerm, qb => qb.orWhere('service', 'like', `%${searchQuery as string}%`))
      .if(isSearchTerm, qb => qb.orWhere('error', 'like', `%${searchQuery as string}%`))
      .if(isSearchTerm, qb => qb.orWhere('misc_data', 'like', `%${searchQuery as string}%`))
      .orderBy('created_at', 'desc')
      .compile()
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
    return Promise.all([
      ridoDB.insertInto('Post').values(post).execute(),
      ridoDB
        .insertInto('Subreddit_Post')
        .values({ subreddit: post.subreddit, post_id: post.post_id })
        .execute(),
    ]).then(F.ignore)
  }

  batchAddPosts(posts: readonly Post[]) {
    const postsSubMapping = posts.map(post => ({ subreddit: post.subreddit, post_id: post.post_id }))

    return Promise.all([
      ridoDB.insertInto('Post').values(posts).execute(),
      ridoDB.insertInto('Subreddit_Post').values(postsSubMapping).execute(),
    ]).then(F.ignore)
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

  updatePostInfo(postDataUpdates: MarkRequired<Partial<Post>, 'post_id'>) {
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

const delay = (): Promise<unknown> =>
  new Promise(resolve => {
    setTimeout(resolve)
  })

// eslint-disable-next-line max-lines-per-function
const thing = (): Promise<void | readonly void[]> =>
  // console.log(DB.thing2())
  // DB.getAllPosts()
  DB.addSubreddit('merp')
    .then(() =>
      Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-magic-numbers
        [...Array(30)].map((_, idx) =>
          delay().then(() =>
            DB.addPost({
              post_id: `asd-${idx}`,
              could_not_download: false,
              downloaded_media_count: 0,
              media_download_tries: 0,
              media_has_been_downloaded: false,
              media_url: 'http://asd.com',
              post_media_images_have_been_processed: false,
              post_thumbnails_created: false,
              post_url: 'http://xcv.com',
              score: 2,
              subreddit: 'merp',
              timestamp: Date.now(),
              title: 'hello',
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
