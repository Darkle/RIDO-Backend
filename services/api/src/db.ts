// import path from 'path'

import { nullable, type Maybe } from 'pratica'
import { F } from '@mobily/ts-belt'
import type { MarkRequired } from 'ts-essentials'
import Surreal, { type Result } from 'surrealdb.js'

import { EE } from './events'
import type { Feed, Log, Post, Settings, Tag } from './entities'

const client = new Surreal('http://127.0.0.1:8000/rpc')

type QueryResults<T> = readonly Result<readonly T[]>[]

function handleResultMultipleItems<T>(
  results: readonly Result<readonly T[]>[]
): readonly T[] | Promise<never> {
  const res = results[0]
  if (!res) return []
  return res.error ? Promise.reject(res.error) : res.result
}

function handleResultSingleItem<T>(results: readonly Result<readonly T[]>[]): Promise<never> | Maybe<T> {
  //NOTE: returning a Maybe when its single item (not an array) to force handle undefined
  const res = results[0]
  if (!res) return nullable(res)
  return res.error ? Promise.reject(res.error) : nullable(res.result[0])
}

class DB {
  readonly close = client.close

  static async init(): Promise<void> {
    return client.use('rido', 'rido')
  }

  static getSettings(): Promise<Settings> {
    // dont need to use `Maybe` here as settings will always be there
    return client.select<Settings>('settings:settings').then(s => s.at(0) as Settings)
  }

  static updateSettings(setting: Partial<Settings>): Promise<void> {
    return client.update('settings:settings', setting).then(updatedSettings => {
      EE.emit('settingsUpdate', updatedSettings)
    })
  }

  static saveLog(log: Log): Promise<void> {
    const otherAsStr = log.otherAsStr ? log.otherAsStr : log.other ? JSON.stringify(log.other) : ''
    return client.create('log', { ...log, otherAsStr }).then(F.ignore)
  }

  static getAllLogs_Paginated(page: number, limit: number): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit

    return client
      .query<QueryResults<Log>>('SELECT * FROM log LIMIT $limit START $skip ORDER BY createdAt DESC', {
        limit,
        skip,
      })
      .then(handleResultMultipleItems)
  }

  static findLogs_AllLevels_WithSearch_Paginated(
    page: number,
    limit: number,
    searchQuery: string
  ): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit

    return client
      .query<QueryResults<Log>>(
        `SELECT *, string::lowercase(message) AS messageLC, string::lowercase(service) AS serviceLC, string::lowercase(error) AS errorLC, string::lowercase(otherAsStr) AS otherAsStrLC FROM log messageLC CONTAINS $sq OR serviceLC CONTAINS $sq OR errorLC CONTAINS $sq OR otherAsStrLC CONTAINS $sq LIMIT $limit START $skip ORDER BY createdAt DESC`,
        { limit, skip, sq: searchQuery }
      )
      .then(handleResultMultipleItems)
  }

  static findLogs_LevelFilter_NoSearch_Paginated(
    page: number,
    limit: number,
    logLevel: Log['level']
  ): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit

    return client
      .query<QueryResults<Log>>(
        `SELECT * FROM log WHERE level = $logLevel LIMIT $limit START $skip ORDER BY createdAt DESC`,
        { limit, skip, logLevel }
      )
      .then(handleResultMultipleItems)
  }

  static findLogs_LevelFilter_WithSearch_Paginated(
    page: number,
    limit: number,
    searchQuery: string,
    logLevel: Log['level']
  ): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit

    return client
      .query<QueryResults<Log>>(
        `SELECT *, string::lowercase(message) AS messageLC, string::lowercase(service) AS serviceLC, string::lowercase(error) AS errorLC, string::lowercase(otherAsStr) AS otherAsStrLC FROM log WHERE level = $logLevel AND messageLC CONTAINS $sq OR serviceLC CONTAINS $sq OR errorLC CONTAINS $sq OR otherAsStrLC CONTAINS $sq LIMIT $limit START $skip ORDER BY createdAt DESC`,
        { limit, skip, sq: searchQuery, logLevel }
      )
      .then(handleResultMultipleItems)
  }

  static getAllPosts(): Promise<readonly Post[]> {
    return client.select('post')
  }

  static getSinglePost(uniqueId: Post['uniqueId']): Promise<Maybe<Post>> {
    return client
      .query<QueryResults<Post>>(`SELECT * FROM post WHERE uniqueId = $uniqueId`, {
        uniqueId,
      })
      .then(handleResultSingleItem)
  }

  static addPost(post: Post): Promise<void> {
    return client.create('post', { ...post }).then(F.ignore)
  }

  static batchAddPosts(posts: readonly Post[]): Promise<void> {
    return client.query('INSERT INTO post ($posts);', { posts }).then(F.ignore)
  }

  static fetchAllPostIds(): Promise<readonly Post[]> {
    return client.query<QueryResults<Post>>(`SELECT postId FROM post`).then(handleResultMultipleItems)
  }

  static getPostsThatNeedMediaToBeDownloaded(): Promise<
    readonly Pick<Post, 'postId' | 'mediaUrl' | 'mediaDownloadTries'>[]
  > {
    return client
      .query<QueryResults<Pick<Post, 'postId' | 'mediaUrl' | 'mediaDownloadTries'>>>(
        `SELECT postId, mediaUrl, mediaDownloadTries FROM post WHERE mediaHasBeenDownloaded = false AND couldNotDownload = false`
      )
      .then(handleResultMultipleItems)
  }

  static getPostsWhereImagesNeedToBeOptimized(): Promise<readonly Post[]> {
    return client
      .query<QueryResults<Post>>(
        `SELECT * FROM post WHERE mediaHasBeenDownloaded = true AND couldNotDownload = false AND postMediaImagesHaveBeenProcessed = false`
      )
      .then(handleResultMultipleItems)
  }

  static updatePostInfo(postDataUpdates: MarkRequired<Partial<Post>, 'postId' | 'feedType'>): Promise<void> {
    const uniqueId = `${postDataUpdates.feedType}-${postDataUpdates.postId}`

    return client
      .query('UPDATE post CONTENT $postDataUpdates WHERE uniqueId = $uniqueId', {
        postDataUpdates,
        uniqueId,
      })
      .then(F.ignore)
  }

  static addFeed(feedName: Feed['feedName'], feedType: Feed['feedType']): Promise<void> {
    return client.create('feed', { feedName, feedType }).then(F.ignore)
  }

  static getAllFeeds(): Promise<readonly Feed[]> {
    return client.query<QueryResults<Feed>>('SELECT * FROM feed').then(handleResultMultipleItems)
  }

  static getSingleFeed(feedName: Feed['feedName'], feedType: Feed['feedName']): Promise<Maybe<Feed>> {
    const feedId = `${feedName}-${feedType}`
    return client
      .query<QueryResults<Feed>>('SELECT * FROM feed WHERE feedId = $feedId', { feedId })
      .then(handleResultSingleItem)
  }

  static getFavouriteFeeds(): Promise<readonly Feed[]> {
    return client
      .query<QueryResults<Feed>>('SELECT * FROM feed WHERE favourited = true')
      .then(handleResultMultipleItems)
  }

  static getFeedsThatNeedToBeUpdated(): Promise<readonly Feed[]> {
    const oneHourInMillisecs = 3_600_000
    const anHourAgo = (): number => Date.now() - oneHourInMillisecs

    return client
      .query<QueryResults<Feed>>('SELECT * FROM feed WHERE lastUpdated < $anHourAgo', {
        anHourAgo: anHourAgo(),
      })
      .then(handleResultMultipleItems)
  }

  static updateFeedLastUpdatedTimeToNow(
    feedName: Feed['feedName'],
    feedType: Feed['feedName']
  ): Promise<void> {
    const feedId = `${feedName}-${feedType}`

    return client
      .query('UPDATE feed CONTENT { lastUpdated: $now } WHERE feedId = $feedId', {
        now: Date.now(),
        feedId,
      })
      .then(F.ignore)
  }

  // // TODO: would a backlink help here? https://www.edgedb.com/docs/intro/schema#backlinks
  // // static getFeedTagsAssociatedWithFeed() {
  // //   return e.select()
  // // }

  // static getAllFeedTags(): Promise<readonly BaseTag[]> {
  //   return e.select(e.Tag, t => ({ ...tagShapeSansIdSansDBLinks(t) })).run(client)
  // }

  static getSingleTag({ tag }: Pick<Tag, 'tag'>): Promise<Maybe<Tag>> {
    return client
      .query<QueryResults<Tag>>('SELECT * FROM tag WHERE tag = $tag', { tag })
      .then(handleResultSingleItem)
  }

  static getAllTags(): Promise<readonly Tag[]> {
    return client.query<QueryResults<Tag>>('SELECT * FROM tag').then(handleResultMultipleItems)
  }

  static getFavouriteTags(): Promise<readonly Tag[]> {
    return client
      .query<QueryResults<Tag>>('SELECT * FROM tag WHERE favourited = true')
      .then(handleResultMultipleItems)
  }
}

// const delay = (): Promise<unknown> =>
//   new Promise(resolve => {
//     setTimeout(resolve)
//   })

// eslint-disable-next-line max-lines-per-function
const thing = (): Promise<void | readonly void[]> =>
  // console.log(DB.thing2())
  // DB.getAllPosts()
  client
    .query(`select {1, 2, 3};`)
    .then(result => {
      console.log(result)
    })
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
