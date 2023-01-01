// import path from 'path'

import { nullable, type Maybe } from 'pratica'
import { F, G } from '@mobily/ts-belt'
import Surreal, { type Result } from 'surrealdb.js'
import invariant from 'tiny-invariant'

import { EE } from './events'
import type { Feed, Log, Post, Settings, Tag } from './entities'

const surrealDB = Surreal.Instance

type QueryResults<T> = readonly Result<readonly T[]>[]

type IncomingPost = Omit<Post, 'feed' | 'uniqueId' | 'tags'>

/*****
  NOTE: When we want to ignore the result AND we are also using using client.query, we need to check
  for an error and throw the error manually as client.query doesnt throw on error but rather returns
  a Result that could contain an error.
*****/
// eslint-disable-next-line complexity
function ignoreQueryResponse(
  results:
    | readonly Result[]
    | readonly { readonly detail: string; readonly status: string; readonly time: string }[]
): void | Promise<never> {
  const res = results[0]
  if (!res) return
  if ('error' in res && res.error) return Promise.reject(res.error)
  if ('status' in res && res.status === 'ERR') return Promise.reject(new Error(res.detail))
}

function handleQueryResultMultipleItems<T>(
  results: readonly Result<readonly T[]>[]
): readonly T[] | Promise<never> {
  const res = results[0]
  if (!res) return []
  return res.error ? Promise.reject(res.error) : res.result
}

function handleQueryResultSingleItem<T>(results: readonly Result<readonly T[]>[]): Promise<never> | Maybe<T> {
  //NOTE: returning a Maybe when its single item (not an array) to force handle undefined
  const res = results[0]
  if (!res) return nullable(res)
  return res.error ? Promise.reject(res.error) : nullable(res.result[0])
}

class DB {
  readonly close = surrealDB.close

  static async init(): Promise<void> {
    await surrealDB.connect('http://127.0.0.1:8000/rpc')
    return surrealDB.use('rido', 'rido')
  }

  static getSettings(): Promise<Settings> {
    // dont need to use `Maybe` here as settings will always be there
    return surrealDB.select<Settings>('settings').then(s => s.at(0) as Settings)
  }

  static updateSettings(setting: Partial<Settings>): Promise<void> {
    return surrealDB
      .query<QueryResults<Settings>>('UPDATE settings:settings MERGE $setting', { setting })
      .then(handleQueryResultSingleItem)
      .then(updatedSettings =>
        updatedSettings.cata({
          Just: s => {
            EE.emit('settingsUpdate', s)
          },
          Nothing: F.ignore,
        })
      )
  }

  static saveLog(log: Omit<Log, 'createdAt'>): Promise<void> {
    const otherAsStr = log.otherAsStr ? log.otherAsStr : log.other ? JSON.stringify(log.other) : ''
    return surrealDB.create('log', { ...log, otherAsStr, createdAt: Date.now() }).then(F.ignore)
  }

  static getAllLogs_Paginated(page: number, limit: number): Promise<readonly Log[]> {
    /*****
      There seems to be a bug in the js client for surreal where it wont allow variables for limit or start,
      so just gonna check the vars are numbers then insert without escaping.
      https://github.com/surrealdb/surrealdb.js/issues/67
    *****/
    invariant(G.isNumber(page), 'page param must be a number')
    invariant(G.isNumber(limit), 'limit param must be a number')

    const skip = page === 1 ? 0 : (page - 1) * limit

    return surrealDB
      .query<QueryResults<Log>>(`SELECT * FROM log ORDER BY createdAt DESC LIMIT ${limit} START ${skip}`)
      .then(handleQueryResultMultipleItems)
  }

  static findLogs_AllLevels_WithSearch_Paginated(
    page: number,
    limit: number,
    searchQuery: string
  ): Promise<readonly Log[]> {
    /*****
      There seems to be a bug in the js client for surreal where it wont allow variables for limit or start,
      so just gonna check the vars are numbers then insert without escaping.
      https://github.com/surrealdb/surrealdb.js/issues/67
    *****/
    invariant(G.isNumber(page), 'page param must be a number')
    invariant(G.isNumber(limit), 'limit param must be a number')

    const skip = page === 1 ? 0 : (page - 1) * limit

    return surrealDB
      .query<QueryResults<Log>>(
        `SELECT * FROM log WHERE string::lowercase(message) CONTAINS $sq OR string::lowercase(service) CONTAINS $sq OR string::lowercase(error) CONTAINS $sq OR string::lowercase(otherAsStr) CONTAINS $sq ORDER BY createdAt DESC LIMIT ${limit} START ${skip}`,
        { sq: searchQuery.toLowerCase() }
      )
      .then(handleQueryResultMultipleItems)
  }

  static findLogs_LevelFilter_NoSearch_Paginated(
    page: number,
    limit: number,
    logLevel: Log['level']
  ): Promise<readonly Log[]> {
    /*****
      There seems to be a bug in the js client for surreal where it wont allow variables for limit or start,
      so just gonna check the vars are numbers then insert without escaping.
      https://github.com/surrealdb/surrealdb.js/issues/67
    *****/
    invariant(G.isNumber(page), 'page param must be a number')
    invariant(G.isNumber(limit), 'limit param must be a number')

    const skip = page === 1 ? 0 : (page - 1) * limit

    return surrealDB
      .query<QueryResults<Log>>(
        `SELECT * FROM log WHERE level = $logLevel ORDER BY createdAt DESC LIMIT ${limit} START ${skip}`,
        { logLevel }
      )
      .then(handleQueryResultMultipleItems)
  }

  static findLogs_LevelFilter_WithSearch_Paginated(
    page: number,
    limit: number,
    searchQuery: string,
    logLevel: Log['level']
  ): Promise<readonly Log[]> {
    /*****
      There seems to be a bug in the js client for surreal where it wont allow variables for limit or start,
      so just gonna check the vars are numbers then insert without escaping.
      https://github.com/surrealdb/surrealdb.js/issues/67
    *****/
    invariant(G.isNumber(page), 'page param must be a number')
    invariant(G.isNumber(limit), 'limit param must be a number')

    const skip = page === 1 ? 0 : (page - 1) * limit

    return surrealDB
      .query<QueryResults<Log>>(
        `SELECT * FROM log WHERE level = $logLevel AND (string::lowercase(message) CONTAINS $sq OR string::lowercase(service) CONTAINS $sq OR string::lowercase(error) CONTAINS $sq OR string::lowercase(otherAsStr) CONTAINS $sq) ORDER BY createdAt DESC LIMIT ${limit} START ${skip}`,
        { sq: searchQuery.toLowerCase(), logLevel }
      )
      .then(handleQueryResultMultipleItems)
  }

  static getAllPosts(): Promise<readonly Post[]> {
    return surrealDB.select('post')
  }

  static getSinglePost(uniqueId: Post['uniqueId']): Promise<Maybe<Post>> {
    return surrealDB
      .query<QueryResults<Post>>(`SELECT * FROM post WHERE uniqueId = $uniqueId`, {
        uniqueId,
      })
      .then(handleQueryResultSingleItem)
  }

  static addPost(post: IncomingPost): Promise<void> {
    return surrealDB.create('post', post).then(F.ignore)
  }

  static batchAddPosts(posts: readonly IncomingPost[]): Promise<void> {
    return surrealDB.query('INSERT INTO post ($posts);', { posts }).then(ignoreQueryResponse)
  }

  //TODO: this may need to be changed cause postId's are no longer unique, might need to get uniqueid, or postid+feed
  // static fetchAllPostIds(): Promise<readonly Post[]> {
  //   return client.query<QueryResults<Post>>(`SELECT postId FROM post`).then(handleResultMultipleItems)
  // }

  static getPostsThatNeedMediaToBeDownloaded(): Promise<readonly Post[]> {
    return surrealDB
      .query<QueryResults<Post>>(
        `SELECT * FROM post WHERE mediaHasBeenDownloaded = false AND couldNotDownload = false`
      )
      .then(handleQueryResultMultipleItems)
  }

  static getPostsWhereImagesNeedToBeOptimized(): Promise<readonly Post[]> {
    return surrealDB
      .query<QueryResults<Post>>(
        `SELECT * FROM post WHERE mediaHasBeenDownloaded = true AND couldNotDownload = false AND postMediaImagesHaveBeenProcessed = false`
      )
      .then(handleQueryResultMultipleItems)
  }

  static updatePostData(
    uniqueId: Post['uniqueId'],
    postDataUpdates: Partial<Omit<Post, 'uniqueId'>>
  ): Promise<void> {
    return surrealDB
      .query('UPDATE post MERGE $postDataUpdates WHERE uniqueId = $uniqueId', {
        postDataUpdates,
        uniqueId,
      })
      .then(ignoreQueryResponse)
  }

  static addFeed(feedName: Feed['feedName'], feedType: Feed['feedType']): Promise<void> {
    return surrealDB.create('feed', { feedName, feedType }).then(F.ignore)
  }

  static getAllFeeds(): Promise<readonly Feed[]> {
    return surrealDB.query<QueryResults<Feed>>('SELECT * FROM feed').then(handleQueryResultMultipleItems)
  }

  static getSingleFeed(feedName: Feed['feedName'], feedType: Feed['feedName']): Promise<Maybe<Feed>> {
    const feedId = `${feedName}-${feedType}`
    return surrealDB
      .query<QueryResults<Feed>>('SELECT * FROM feed WHERE feedId = $feedId', { feedId })
      .then(handleQueryResultSingleItem)
  }

  static getFavouriteFeeds(): Promise<readonly Feed[]> {
    return surrealDB
      .query<QueryResults<Feed>>('SELECT * FROM feed WHERE favourited = true')
      .then(handleQueryResultMultipleItems)
  }

  static getFeedsThatNeedToBeUpdated(): Promise<readonly Feed[]> {
    const oneHourInMillisecs = 3_600_000
    const anHourAgo = (): number => Date.now() - oneHourInMillisecs

    return surrealDB
      .query<QueryResults<Feed>>('SELECT * FROM feed WHERE lastUpdated < $anHourAgo', {
        anHourAgo: anHourAgo(),
      })
      .then(handleQueryResultMultipleItems)
  }

  static updateFeedLastUpdatedTimeToNow(
    feedName: Feed['feedName'],
    feedType: Feed['feedName']
  ): Promise<void> {
    const feedId = `${feedName}-${feedType}`

    return surrealDB
      .query('UPDATE feed set lastUpdated = $nowMS WHERE feedId = $feedId', {
        nowMS: Date.now(),
        feedId,
      })
      .then(ignoreQueryResponse)
  }

  // // TODO: would a backlink help here? https://www.edgedb.com/docs/intro/schema#backlinks
  // // static getFeedTagsAssociatedWithFeed() {
  // //   return e.select()
  // // }

  // static getAllFeedTags(): Promise<readonly BaseTag[]> {
  //   return e.select(e.Tag, t => ({ ...tagShapeSansIdSansDBLinks(t) })).run(client)
  // }

  static getSingleTag({ tag }: Pick<Tag, 'tag'>): Promise<Maybe<Tag>> {
    return surrealDB
      .query<QueryResults<Tag>>('SELECT * FROM tag WHERE tag = $tag', { tag })
      .then(handleQueryResultSingleItem)
  }

  static getAllTags(): Promise<readonly Tag[]> {
    return surrealDB.query<QueryResults<Tag>>('SELECT * FROM tag').then(handleQueryResultMultipleItems)
  }

  static getFavouriteTags(): Promise<readonly Tag[]> {
    return surrealDB
      .query<QueryResults<Tag>>('SELECT * FROM tag WHERE favourited = true')
      .then(handleQueryResultMultipleItems)
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
  surrealDB
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
