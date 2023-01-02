import path from 'path'

import { F, G } from '@mobily/ts-belt'
import invariant from 'tiny-invariant'
import Knex from 'knex'

import { EE } from './events'
import type { Feed, Log, Post, Settings, Tag } from './entities'
import { getEnvFilePath } from './utils'
import { autoCastValuesToFromDB } from './dbValAutoCasting'
import type { Maybe } from 'pratica'

const dbFilePath = path.join(getEnvFilePath(process.env['DATA_PATH']), 'RIDO.db')

const knex = Knex({ client: 'sqlite3', connection: { filename: dbFilePath } })

type IncomingPost = Omit<
  Post,
  | 'uniqueId'
  | 'feed'
  | 'tags'
  | 'feedDomain'
  | 'feedId'
  | 'mediaHasBeenDownloaded'
  | 'couldNotDownload'
  | 'postMediaImagesHaveBeenProcessed'
  | 'postThumbnailsCreated'
  | 'postMediaImagesProcessingError'
  | 'downloadError'
  | 'mediaDownloadTries'
  | 'downloadedMediaCount'
  | 'downloadedMedia'
>

class DBMethods {
  constructor() {
    return autoCastValuesToFromDB(this)
  }

  readonly close = knex.destroy

  getSettings(): Promise<Maybe<Settings>> {
    return knex<Settings>('Settings').where('uniqueId', 'settings').first<Maybe<Settings>>()
  }

  updateSettings(setting: Partial<Settings>): Promise<void> {
    return knex('Settings').where('uniqueId', 'settings').update(setting).then(F.ignore)
  }

  saveLog(log: Omit<Log, 'createdAt'>): Promise<void> {
    const otherAsStr = log.otherAsStr ? log.otherAsStr : log.other ? JSON.stringify(log.other) : ''

    return knex('Log')
      .insert({ ...log, otherAsStr, createdAt: Date.now() })
      .then(F.ignore)
  }

  getAllLogs_Paginated(page: number, limit: number): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit

    return knex<Log>('Log').orderBy('createdAt', 'desc').limit(limit).offset(skip)
  }

  findLogs_AllLevels_WithSearch_Paginated(
    page: number,
    limit: number,
    searchQuery: string
  ): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit
    const sq = `%${searchQuery.toLowerCase()}%`

    return knex<Log>('Log')
      .whereILike('message', sq)
      .orWhereILike('service', sq)
      .orWhereILike('error', sq)
      .orWhereILike('otherAsStr', sq)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(skip)
  }

  findLogs_LevelFilter_NoSearch_Paginated(
    page: number,
    limit: number,
    logLevel: Log['level']
  ): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit

    return knex<Log>('Log').where({ level: logLevel }).orderBy('createdAt', 'desc').limit(limit).offset(skip)
  }

  findLogs_LevelFilter_WithSearch_Paginated(
    page: number,
    limit: number,
    searchQuery: string,
    logLevel: Log['level']
  ): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit
    const sq = `%${searchQuery.toLowerCase()}%`

    return knex<Log>('Log')
      .where({ level: logLevel })
      .andWhere(function () {
        this.whereILike('message', sq)
          .orWhereILike('service', sq)
          .orWhereILike('error', sq)
          .orWhereILike('otherAsStr', sq)
      })
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(skip)
  }

  getAllPosts(): Promise<readonly Post[]> {
    return knex<Post>('Post')
  }

  getSinglePost(feedDomain: Post['feedDomain'], postId: Post['postId']): Promise<Maybe<Post>> {
    return knex<Post>('Post').where({ feedDomain, postId }).first<Maybe<Post>>()
  }

  // eslint-disable-next-line max-lines-per-function
  async batchAddPosts(
    posts: readonly IncomingPost[],
    feedDomain: Post['feedDomain'],
    feedId: Post['feedId']
  ): Promise<void> {
    invariant(feedDomain.includes('.'), 'feedDomain is not a valid domain')

    const postsOwnerFeed = await knex<Feed>('Feed').where({ feedDomain, feedId }).first()

    invariant(postsOwnerFeed, 'There is no owner feed for these posts')

    const postsReadyForDB = posts.map(post => ({
      ...post,
      feedDomain,
      feedId,
      uniqueId: `${feedDomain}-${post.postId}`,
    }))

    //TODO: Check whats the max amount of posts insert can do.
    return knex<Post>('Post')
      .insert(postsReadyForDB)
      .returning('postId')
      .onConflict()
      .ignore()
      .then(res =>
        knex<Feed>('Feed').select('posts').where({ feedDomain, feedId }).jsonExtract('posts', '$').first()
      )
      .then(res => console.log(res))
      .then(F.ignore)
  }

  // //TODO: this may need to be changed cause postId's are no longer unique, might need to get uniqueid, or postid+feed
  // // fetchAllPostIds(): Promise<readonly Post[]> {
  // //   return client.query<QueryResults<Post>>(`SELECT postId FROM post`).then(handleResultMultipleItems)
  // // }

  // getPostsThatNeedMediaToBeDownloaded(): Promise<readonly Post[]> {
  //   return surrealdb
  //     .query<QueryResults<Post>>(
  //       `SELECT * FROM post WHERE mediaHasBeenDownloaded = false AND couldNotDownload = false`
  //     )
  //     .then(handleQueryResultMultipleItems)
  // }

  // getPostsWhereImagesNeedToBeOptimized(): Promise<readonly Post[]> {
  //   return surrealdb
  //     .query<QueryResults<Post>>(
  //       `SELECT * FROM post WHERE mediaHasBeenDownloaded = true AND couldNotDownload = false AND postMediaImagesHaveBeenProcessed = false`
  //     )
  //     .then(handleQueryResultMultipleItems)
  // }

  // updatePostData(
  //   feedDomain: Post['feedDomain'],
  //   feedId: Post['feedId'],
  //   postDataUpdates: Partial<Omit<Post>>
  // ): Promise<void> {
  //   return surrealdb
  //     .query('UPDATE post MERGE $postDataUpdates WHERE uniqueId = $uniqueId', {
  //       postDataUpdates,
  //     })
  //     .then(ignoreQueryResponse)
  // }

  addFeed(feedId: Feed['feedId'], feedDomain: Feed['feedDomain']): Promise<void> {
    invariant(feedDomain.includes('.'), 'feedDomain is not a valid domain')

    const uniqueId = `${feedDomain}-${feedId}`

    // Lowercase feedId for reddit as they may have different casing when input
    const fId = feedDomain === 'reddit.com' ? feedId.toLowerCase() : feedId

    return knex<Feed>('Feed')
      .insert({ feedId: fId, feedDomain, uniqueId })
      .onConflict()
      .ignore()
      .then(F.ignore)
  }

  // getAllFeeds(): Promise<readonly Feed[]> {
  //   return surrealdb.query<QueryResults<Feed>>('SELECT * FROM feed').then(handleQueryResultMultipleItems)
  // }

  // getSingleFeed(feedId: Feed['feedId'], feedDomain: Feed['feedDomain']): Promise<Maybe<Feed>> {
  //   invariant(feedDomain.includes('.'), 'feedDomain is not a valid domain')

  //   return surrealdb
  //     .query<QueryResults<Feed>>('SELECT * FROM feed WHERE feedId = $uniqueId', { uniqueId })
  //     .then(handleQueryResultSingleItem)
  // }

  // getFavouriteFeeds(): Promise<readonly Feed[]> {
  //   return surrealdb
  //     .query<QueryResults<Feed>>('SELECT * FROM feed WHERE favourited = true')
  //     .then(handleQueryResultMultipleItems)
  // }

  // getFeedsThatNeedToBeUpdated(): Promise<readonly Feed[]> {
  //   const oneHourInMillisecs = 3_600_000
  //   const anHourAgo = (): number => Date.now() - oneHourInMillisecs

  //   return surrealdb
  //     .query<QueryResults<Feed>>('SELECT * FROM feed WHERE lastUpdated < $anHourAgo', {
  //       anHourAgo: anHourAgo(),
  //     })
  //     .then(handleQueryResultMultipleItems)
  // }

  // updateFeedLastUpdatedTimeToNow(feedId: Feed['feedId'], feedDomain: Feed['feedDomain']): Promise<void> {
  //   invariant(feedDomain.includes('.'), 'feedDomain is not a valid domain')

  //   return surrealdb
  //     .query('UPDATE feed set lastUpdated = $nowMS WHERE feedId = $uniqueId', {
  //       nowMS: Date.now(),
  //     })
  //     .then(ignoreQueryResponse)
  // }

  // // // TODO: would a backlink help here? https://www.edgedb.com/docs/intro/schema#backlinks
  // // // getFeedTagsAssociatedWithFeed() {
  // // //   return e.select()
  // // // }

  // // getAllFeedTags(): Promise<readonly BaseTag[]> {
  // //   return e.select(e.Tag, t => ({ ...tagShapeSansIdSansDBLinks(t) })).run(client)
  // // }

  // getSingleTag({ tag }: Pick<Tag, 'tag'>): Promise<Maybe<Tag>> {
  //   return surrealdb
  //     .query<QueryResults<Tag>>('SELECT * FROM tag WHERE tag = $tag', { tag })
  //     .then(handleQueryResultSingleItem)
  // }

  // getAllTags(): Promise<readonly Tag[]> {
  //   return surrealdb.query<QueryResults<Tag>>('SELECT * FROM tag').then(handleQueryResultMultipleItems)
  // }

  // getFavouriteTags(): Promise<readonly Tag[]> {
  //   return surrealdb
  //     .query<QueryResults<Tag>>('SELECT * FROM tag WHERE favourited = true')
  //     .then(handleQueryResultMultipleItems)
  // }
}

// const delay = (): Promise<unknown> =>
//   new Promise(resolve => {
//     setTimeout(resolve)
//   })

const DB = new DBMethods()

type DBInstanceType = typeof DB

// eslint-disable-next-line max-lines-per-function
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
export type { DBInstanceType }
