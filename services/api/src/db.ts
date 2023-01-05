import path from 'path'

import { F, G } from '@mobily/ts-belt'
import invariant from 'tiny-invariant'
// import RethinkDB from 'rethinkdb'
import { r, type Connection } from 'rethinkdb-ts'

import { EE } from './events'
import type { DBTable, Feed, IncomingLog, Log, Post, Settings, Tag } from './entities'
import { getEnvFilePath } from './utils'
import { nullable, type Maybe } from 'pratica'

// eslint-disable-next-line functional/no-let
let connection: Connection
// const r = RethinkDB.db('rido')

const defaultSettings = {
  uniqueId: 'settings',
  numberMediaDownloadsAtOnce: 2,
  numberImagesProcessAtOnce: 2,
  updateAllDay: true,
  updateStartingHour: 1,
  /* eslint-disable @typescript-eslint/no-magic-numbers */
  updateEndingHour: 7,
  imageCompressionQuality: 80,
  maxImageWidthDorNonArchiveImage: 1400,
  /* eslint-enable @typescript-eslint/no-magic-numbers */
}

class DB {
  // eslint-disable-next-line max-lines-per-function
  static init(): Promise<void> {
    const createDB = (): Promise<void> =>
      r
        .dbList()
        .run()
        .then(dbs => (dbs.includes('rido') ? F.ignore() : r.dbCreate('rido').run().then(F.ignore)))

    const createDefaultSettings = (): Promise<void> =>
      r
        .table<Settings>('Settings')
        .run()
        .then(results =>
          results[0] ? F.ignore() : r.table('Settings').insert(defaultSettings).run().then(F.ignore)
        )

    const createTables = (): Promise<void> =>
      r
        .tableList()
        .run()
        .then(tables =>
          !tables.length
            ? Promise.all([
                r.tableCreate('Settings', { primaryKey: 'uniqueId' }).run(),
                r.tableCreate('Log').run(),
                r.tableCreate('Post', { primaryKey: 'uniqueId' }).run(),
                r.tableCreate('Feed', { primaryKey: 'uniqueId' }).run(),
                r.tableCreate('Tag', { primaryKey: 'tag' }).run(),
              ]).then(F.ignore)
            : F.ignore()
        )

    const createTableIndexes = (): Promise<void> =>
      r
        .table('Log')
        .indexList()
        .run()
        .then(indexes =>
          !indexes.length
            ? Promise.all([r.table('Log').indexCreate('level').run()]).then(F.ignore)
            : F.ignore()
        )

    return r
      .connectPool({ host: 'localhost', db: 'rido' })
      .then(createDB)
      .then(createTables)
      .then(createDefaultSettings)
      .then(createTableIndexes)
  }

  readonly close = connection.close

  static getSettings(): Promise<Settings> {
    return (
      r
        .table<Settings>('Settings')
        .run()
        // No need for Maybe here as settings will always be there
        .then(results => results[0] as Settings)
    )
  }

  static updateSettings(setting: Partial<Settings>): Promise<void> {
    return r.table('Settings').filter(r.row('uniqueId').eq('settings')).update(setting).run().then(F.ignore)
  }

  static saveLog(log: IncomingLog): Promise<void> {
    const otherAsStr = log.other ? JSON.stringify(log.other) : ''

    return r
      .table('Log')
      .insert({ ...log, otherAsStr, createdAt: Date.now() })
      .run()
      .then(F.ignore)
  }

  static getAllLogs_Paginated(page: number, limit: number): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit

    return r.table<Log>('Log').orderBy('createdAt', 'desc').limit(limit).skip(skip).run()
  }

  // static findLogs_AllLevels_WithSearch_Paginated(
  //   page: number,
  //   limit: number,
  //   searchQuery: string
  // ): Promise<readonly Log[]> {
  //   const skip = page === 1 ? 0 : (page - 1) * limit
  //   const sq = `%${searchQuery.toLowerCase()}%`

  //   return knex<Log>('Log')
  //     .whereILike('message', sq)
  //     .orWhereILike('service', sq)
  //     .orWhereILike('error', sq)
  //     .orWhereILike('otherAsStr', sq)
  //     .orderBy('createdAt', 'desc')
  //     .limit(limit)
  //     .offset(skip)
  // }

  // static findLogs_LevelFilter_NoSearch_Paginated(
  //   page: number,
  //   limit: number,
  //   logLevel: Log['level']
  // ): Promise<readonly Log[]> {
  //   const skip = page === 1 ? 0 : (page - 1) * limit

  //   return knex<Log>('Log').where({ level: logLevel }).orderBy('createdAt', 'desc').limit(limit).offset(skip)
  // }

  // static findLogs_LevelFilter_WithSearch_Paginated(
  //   page: number,
  //   limit: number,
  //   searchQuery: string,
  //   logLevel: Log['level']
  // ): Promise<readonly Log[]> {
  //   const skip = page === 1 ? 0 : (page - 1) * limit
  //   const sq = `%${searchQuery.toLowerCase()}%`

  //   return knex<Log>('Log')
  //     .where({ level: logLevel })
  //     .andWhere(function () {
  //       this.whereILike('message', sq)
  //         .orWhereILike('service', sq)
  //         .orWhereILike('error', sq)
  //         .orWhereILike('otherAsStr', sq)
  //     })
  //     .orderBy('createdAt', 'desc')
  //     .limit(limit)
  //     .offset(skip)
  // }

  // static getAllPosts(): Promise<readonly Post[]> {
  //   return knex<Post>('Post')
  // }

  // static getSinglePost(feedDomain: Post['feedDomain'], postId: Post['postId']): Promise<Maybe<Post>> {
  //   return knex<Post>('Post').where({ feedDomain, postId }).first<Maybe<Post>>()
  // }

  // // eslint-disable-next-line max-lines-per-function
  // static async batchAddPosts(
  //   posts: readonly IncomingPost[],
  //   feedDomain: Post['feedDomain'],
  //   feedId: Post['feedId']
  // ): Promise<void> {
  //   invariant(feedDomain.includes('.'), 'feedDomain is not a valid domain')

  //   const postsOwnerFeed = await knex<Feed>('Feed').where({ feedDomain, feedId }).first()

  //   invariant(postsOwnerFeed, 'There is no owner feed for these posts')

  //   const postsReadyForDB = posts.map(post => ({
  //     ...post,
  //     feedDomain,
  //     feedId,
  //     uniqueId: `${feedDomain}-${post.postId}`,
  //   }))

  //   //TODO: Check whats the max amount of posts insert can do.
  //   return knex<Post>('Post')
  //     .insert(postsReadyForDB)
  //     .returning('postId')
  //     .onConflict()
  //     .ignore()
  //     .then(res =>
  //       knex<Feed>('Feed')
  //         .select('posts')
  //         .where({ feedDomain, feedId })
  //         .first()
  //         .then(feedPosts => {
  //           const currentFeedPosts = Array.isArray(feedPosts) ? feedPosts : []
  //           const insertedPostIds = res.map(post => post.postId)

  //           return knex<Feed>('Feed')
  //             .where({ feedDomain, feedId })
  //             .jsonSet('posts', '$', JSON.stringify([...currentFeedPosts, ...insertedPostIds]))
  //         })
  //     )
  //     .then(res => console.log(res))
  //     .then(F.ignore)
  // }

  // // //TODO: this may need to be changed cause postId's are no longer unique, might need to get uniqueid, or postid+feed
  // // // static fetchAllPostIds(): Promise<readonly Post[]> {
  // // //   return client.query<QueryResults<Post>>(`SELECT postId FROM post`).then(handleResultMultipleItems)
  // // // }

  // // static getPostsThatNeedMediaToBeDownloaded(): Promise<readonly Post[]> {
  // //   return surrealdb
  // //     .query<QueryResults<Post>>(
  // //       `SELECT * FROM post WHERE mediaHasBeenDownloaded = false AND couldNotDownload = false`
  // //     )
  // //     .then(handleQueryResultMultipleItems)
  // // }

  // // static getPostsWhereImagesNeedToBeOptimized(): Promise<readonly Post[]> {
  // //   return surrealdb
  // //     .query<QueryResults<Post>>(
  // //       `SELECT * FROM post WHERE mediaHasBeenDownloaded = true AND couldNotDownload = false AND postMediaImagesHaveBeenProcessed = false`
  // //     )
  // //     .then(handleQueryResultMultipleItems)
  // // }

  // // static updatePostData(
  // //   feedDomain: Post['feedDomain'],
  // //   feedId: Post['feedId'],
  // //   postDataUpdates: Partial<Omit<Post>>
  // // ): Promise<void> {
  // //   return surrealdb
  // //     .query('UPDATE post MERGE $postDataUpdates WHERE uniqueId = $uniqueId', {
  // //       postDataUpdates,
  // //     })
  // //     .then(ignoreQueryResponse)
  // // }

  // static addFeed(feedId: Feed['feedId'], feedDomain: Feed['feedDomain']): Promise<void> {
  //   invariant(feedDomain.includes('.'), 'feedDomain is not a valid domain')

  //   const uniqueId = `${feedDomain}-${feedId}`

  //   // Lowercase feedId for reddit as they may have different casing when input
  //   const fId = feedDomain === 'reddit.com' ? feedId.toLowerCase() : feedId

  //   return knex<Feed>('Feed')
  //     .insert({ feedId: fId, feedDomain, uniqueId })
  //     .onConflict()
  //     .ignore()
  //     .then(F.ignore)
  // }

  // // static getAllFeeds(): Promise<readonly Feed[]> {
  // //   return surrealdb.query<QueryResults<Feed>>('SELECT * FROM feed').then(handleQueryResultMultipleItems)
  // // }

  // // static getSingleFeed(feedId: Feed['feedId'], feedDomain: Feed['feedDomain']): Promise<Maybe<Feed>> {

  // //   return surrealdb
  // //     .query<QueryResults<Feed>>('SELECT * FROM feed WHERE feedId = $uniqueId', { uniqueId })
  // //     .then(handleQueryResultSingleItem)
  // // }

  // // static getFavouriteFeeds(): Promise<readonly Feed[]> {
  // //   return surrealdb
  // //     .query<QueryResults<Feed>>('SELECT * FROM feed WHERE favourited = true')
  // //     .then(handleQueryResultMultipleItems)
  // // }

  // // static getFeedsThatNeedToBeUpdated(): Promise<readonly Feed[]> {
  // //   const oneHourInMillisecs = 3_600_000
  // //   const anHourAgo = (): number => Date.now() - oneHourInMillisecs

  // //   return surrealdb
  // //     .query<QueryResults<Feed>>('SELECT * FROM feed WHERE updateCheck_lastUpdated < $anHourAgo', {
  // //       anHourAgo: anHourAgo(),
  // //     })
  // //     .then(handleQueryResultMultipleItems)
  // // }

  // // static updateFeedLastUpdatedTimeToNow(feedId: Feed['feedId'], feedDomain: Feed['feedDomain']): Promise<void> {

  // //   return surrealdb
  // //     .query('UPDATE feed set updateCheck_lastUpdated = $nowMS WHERE feedId = $uniqueId', {
  // //       nowMS: Date.now(),
  // //     })
  // //     .then(ignoreQueryResponse)
  // // }

  // // // // TODO: would a backlink help here? https://www.edgedb.com/docs/intro/schema#backlinks
  // // // // static getFeedTagsAssociatedWithFeed() {
  // // // //   return e.select()
  // // // // }

  // // //static  getAllFeedTags(): Promise<readonly BaseTag[]> {
  // // //   return e.select(e.Tag, t => ({ ...tagShapeSansIdSansDBLinks(t) })).run(client)
  // // // }

  // // static getSingleTag({ tag }: Pick<Tag, 'tag'>): Promise<Maybe<Tag>> {
  // //   return surrealdb
  // //     .query<QueryResults<Tag>>('SELECT * FROM tag WHERE tag = $tag', { tag })
  // //     .then(handleQueryResultSingleItem)
  // // }

  // // static getAllTags(): Promise<readonly Tag[]> {
  // //   return surrealdb.query<QueryResults<Tag>>('SELECT * FROM tag').then(handleQueryResultMultipleItems)
  // // }

  // // static getFavouriteTags(): Promise<readonly Tag[]> {
  // //   return surrealdb
  // //     .query<QueryResults<Tag>>('SELECT * FROM tag WHERE favourited = true')
  // //     .then(handleQueryResultMultipleItems)
  // // }
}

// const delay = (): Promise<unknown> =>
//   new Promise(resolve => {
//     setTimeout(resolve)
//   })

const thing = (): Promise<void | readonly void[]> =>
  // console.log(DB.thing2())
  // DB.getAllPosts()
  DB.getSettings()
    .then(res => {
      res.cata({
        Just: h => console.log(h),
        Nothing: () => console.log(`no data :-(`),
      })
      // console.log(res)
    })
    // surrealdb
    //   .query(`select {1, 2, 3};`)
    //   .then(result => {
    //     console.log(result)
    //   })
    // DB.addSubreddit('merp')
    //   .then(() =>
    //     Promise.all(
    //       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-magic-numbers
    //       [...Array(30)].map((_, idx) =>
    //         delay().then(() =>
    //           DB.addPost({
    //             postId: `asd-${idx}`,
    //             couldNotDownload: false,
    //             downloadedMediaCount: 0,
    //             mediaDownloadTries: 0,
    //             mediaHasBeenDownloaded: false,
    //             mediaUrl: 'http://asd.com',
    //             postMediaImagesHaveBeenProcessed: false,
    //             postThumbnailsCreated: false,
    //             postUrl: 'http://xcv.com',
    //             score: 2,
    //             subreddit: 'merp',
    //             timestamp: Date.now(),
    //             title: 'hello',
    //           })
    //         )
    //       )
    //     )
    //   )
    .catch(err => {
      console.log('caught in catch:')
      console.error(err)
    })

export { thing, DB }
export type { IncomingPost }
