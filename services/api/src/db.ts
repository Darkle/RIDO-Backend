// import path from 'path'

import { nullable, type Maybe } from 'pratica'
import { F } from '@mobily/ts-belt'
import type { MarkRequired } from 'ts-essentials'
import { createClient } from 'edgedb'

import { EE } from './events'
import e from '../dbschema/edgeql-js'
import type { Settings, Log, Post, Feed, Tag } from '../dbschema/interfaces'

const client = createClient()

/*****
  Sans DB links
*****/
type BasePost = Omit<Post, 'feed' | 'tags' | 'id'>
type BaseFeed = Omit<Feed, 'feedNameLC' | 'posts' | 'tags' | 'id'>
type BaseTag = Omit<Tag, 'posts' | 'id'>

const settingsShapeSansId = e.shape(e.Settings, () => ({
  archiveImageCompressionQuality: true,
  imageCompressionQuality: true,
  maxImageWidthForNonArchiveImage: true,
  numberImagesProcessAtOnce: true,
  numberMediaDownloadsAtOnce: true,
  uniqueId: true,
  updateAllDay: true,
  updateEndingHour: true,
  updateStartingHour: true,
}))

const postShapeSansIdSansDBLinks = e.shape(e.Settings, () => ({
  uniqueId: true,
  postId: true,
  feedType: true,
  feedName: true,
  title: true,
  postUrl: true,
  score: true,
  timestamp: true,
  mediaUrl: true,
  mediaHasBeenDownloaded: true,
  couldNotDownload: true,
  postMediaImagesHaveBeenProcessed: true,
  postMediaImagesProcessingError: true,
  postThumbnailsCreated: true,
  mediaDownloadTries: true,
  downloadedMediaCount: true,
  downloadError: true,
  downloadedMedia: true,
}))

const feedShapeSansIdSansDBLinks = e.shape(e.Settings, () => ({
  feedId: true,
  feedType: true,
  feedName: true,
  favourited: true,
  lastUpdated: true,
  updateCheck_LastPostSeen: true,
}))

const tagShapeSansIdSansDBLinks = e.shape(e.Settings, () => ({
  tag: true,
  favourited: true,
}))

/*****
  NOTE: return a Maybe (nullable) if its a read query for a single item
*****/
class DB {
  readonly close = client.close

  static async init(): Promise<void> {
    const settings = await DB.getSettings()

    return settings ? Promise.resolve() : DB.createInitialSettings()
  }

  static createInitialSettings(): Promise<void> {
    return e.insert(e.Settings, { uniqueId: 'settings' }).run(client).then(F.ignore)
  }

  static getSettings(): Promise<Settings> {
    return (
      e
        .select(e.Settings, s => ({ ...settingsShapeSansId(s), filter_single: { uniqueId: 'settings' } }))
        // dont need Maybe here as settings will always be there
        .run(client) as Promise<Settings>
    )
  }

  // eslint-disable-next-line max-lines-per-function
  static updateSettings(setting: Partial<Settings>): Promise<void> {
    return e
      .update(e.Settings, () => ({
        filter_single: { uniqueId: 'settings' },
        set: { ...setting },
      }))
      .run(client)
      .then(() =>
        e
          .select(e.Settings, s => ({ ...settingsShapeSansId(s), filter_single: { uniqueId: 'settings' } }))
          .run(client)
      )
      .then(updatedSettings => {
        // We know that settings will be there
        EE.emit('settingsUpdate', updatedSettings as Settings)
      })
  }

  static saveLog(log: Log): Promise<void> {
    return e
      .insert(e.Log, { ...log })
      .run(client)
      .then(F.ignore)
  }

  static getAllLogs_Paginated(page: number, limit: number): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit

    return e
      .select(e.Log, log => ({
        ...e.Log['*'],
        limit,
        offset: skip,
        order_by: {
          expression: log.createdAt,
          direction: e.DESC,
        },
      }))
      .run(client)
  }

  // eslint-disable-next-line max-lines-per-function
  static findLogs_AllLevels_WithSearch_Paginated(
    page: number,
    limit: number,
    searchQuery: string
  ): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit
    const sq = `%${searchQuery}%`

    return e
      .select(e.Log, log => ({
        ...e.Log['*'],
        limit,
        offset: skip,
        order_by: {
          expression: log.createdAt,
          direction: e.DESC,
        },
        filter: e.op(
          e.op(e.op(log.message, 'ilike', sq), 'or', e.op(log.service, 'ilike', sq)),
          'or',
          e.op(e.op(log.error, 'ilike', sq), 'or', e.op(log.otherAsStr, 'ilike', sq))
        ),
      }))
      .run(client)
  }

  static findLogs_LevelFilter_NoSearch_Paginated(
    page: number,
    limit: number,
    logLevel: Log['level']
  ): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit

    return e
      .select(e.Log, log => ({
        ...e.Log['*'],
        limit,
        offset: skip,
        order_by: {
          expression: log.createdAt,
          direction: e.DESC,
        },
        filter: e.op(log.level, '=', logLevel),
      }))
      .run(client)
  }

  // eslint-disable-next-line max-lines-per-function
  static findLogs_LevelFilter_WithSearch_Paginated(
    page: number,
    limit: number,
    searchQuery: string,
    logLevel: Log['level']
  ): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit
    const sq = `%${searchQuery}%`

    return e
      .select(e.Log, log => ({
        ...e.Log['*'],
        limit,
        offset: skip,
        order_by: {
          expression: log.createdAt,
          direction: e.DESC,
        },
        filter: e.op(
          e.op(log.level, '=', logLevel),
          'and',
          e.op(
            e.op(e.op(log.message, 'ilike', sq), 'or', e.op(log.service, 'ilike', sq)),
            'or',
            e.op(e.op(log.error, 'ilike', sq), 'or', e.op(log.otherAsStr, 'ilike', sq))
          )
        ),
      }))
      .run(client)
  }

  static getAllPosts(): Promise<readonly BasePost[]> {
    return e.select(e.Post, p => ({ ...postShapeSansIdSansDBLinks(p) })).run(client)
  }

  static getSinglePost(uniqueId: Post['uniqueId']): Promise<Maybe<BasePost>> {
    return e
      .select(e.Post, p => ({ ...postShapeSansIdSansDBLinks(p), filter_single: { uniqueId } }))
      .run(client)
      .then(nullable)
  }

  static addPost(post: BasePost): Promise<void> {
    return e.insert(e.Post, post).run(client).then(F.ignore)
  }

  // eslint-disable-next-line max-lines-per-function
  static batchAddPosts(posts: readonly BasePost[]): Promise<void> {
    /*****
      Docs state that you need to set any optional columns to null when using for loop
      https://www.edgedb.com/docs/clients/js/for#bulk-inserts
    *****/
    // Since json_get returns an empty set if nothing there, i think perhaps i dont need to do this
    // const nulledOptionalPostColumns = {
    //   couldNotDownload: null,
    //   downloadError: null,
    //   downloadedMedia: null,
    //   downloadedMediaCount: null,
    //   mediaDownloadTries: null,
    //   mediaHasBeenDownloaded: null,
    //   postMediaImagesHaveBeenProcessed: null,
    //   postMediaImagesProcessingError: null,
    //   postThumbnailsCreated: null,
    // }

    // const postsReadyForDb = posts.map(post => ({ ...nulledOptionalPostColumns, ...post }))
    // eslint-disable-next-line max-lines-per-function
    const query = e.params({ posts: e.json }, params =>
      // eslint-disable-next-line max-lines-per-function
      e.for(e.json_array_unpack(params.posts), post =>
        e
          .insert(e.Post, {
            timestamp: e.cast(e.int64, e.json_get(post, 'timestamp')),
            feedType: e.cast(e.str, e.json_get(post, 'feedType')),
            feedName: e.cast(e.str, e.json_get(post, 'feedName')),
            mediaUrl: e.cast(e.str, e.json_get(post, 'mediaUrl')),
            postId: e.cast(e.str, e.json_get(post, 'postId')),
            postUrl: e.cast(e.str, e.json_get(post, 'postUrl')),
            score: e.cast(e.int64, e.json_get(post, 'score')),
            title: e.cast(e.str, e.json_get(post, 'title')),
            postThumbnailsCreated: e.cast(e.bool, e.json_get(post, 'postThumbnailsCreated')),
            postMediaImagesProcessingError: e.cast(e.str, e.json_get(post, 'postMediaImagesProcessingError')),
            postMediaImagesHaveBeenProcessed: e.cast(
              e.bool,
              e.json_get(post, 'postMediaImagesHaveBeenProcessed')
            ),
            mediaHasBeenDownloaded: e.cast(e.bool, e.json_get(post, 'mediaHasBeenDownloaded')),
            mediaDownloadTries: e.cast(e.int32, e.json_get(post, 'mediaDownloadTries')),
            downloadedMediaCount: e.cast(e.int32, e.json_get(post, 'downloadedMediaCount')),
            downloadedMedia: e.cast(e.array(e.str), e.json_get(post, 'downloadedMedia')),
            downloadError: e.cast(e.str, e.json_get(post, 'downloadError')),
            couldNotDownload: e.cast(e.bool, e.json_get(post, 'couldNotDownload')),
          })
          .unlessConflict(p => ({ on: p.postId }))
      )
    )

    return query.run(client, { posts }).then(F.ignore)
  }

  static fetchAllPostIds(): Promise<readonly BasePost['postId'][]> {
    return e
      .select(e.Post, () => ({ postId: true }))
      .run(client)
      .then(results => results.map(result => result.postId))
  }

  static getPostsThatNeedMediaToBeDownloaded(): Promise<
    readonly Pick<BasePost, 'postId' | 'mediaUrl' | 'mediaDownloadTries'>[]
  > {
    return e
      .select(e.Post, post => ({
        postId: true,
        mediaUrl: true,
        mediaDownloadTries: true,
        filter: e.op(
          e.op(post.mediaHasBeenDownloaded, '=', false),
          'and',
          e.op(post.couldNotDownload, '=', false)
        ),
      }))
      .run(client)
  }

  static getPostsWhereImagesNeedToBeOptimized(): Promise<readonly BasePost[]> {
    return Promise.resolve(
      e
        .select(e.Post, post => ({
          ...postShapeSansIdSansDBLinks(post),
          filter: e.op(
            e.op(post.mediaHasBeenDownloaded, '=', true),
            'and',
            e.op(
              e.op(post.couldNotDownload, '=', false),
              'and',
              e.op(post.postMediaImagesHaveBeenProcessed, '=', false)
            )
          ),
        }))
        .run(client)
    )
  }

  static updatePostInfo(
    postDataUpdates: MarkRequired<Partial<BasePost>, 'postId' | 'feedType'>
  ): Promise<void> {
    const uniqueId = `${postDataUpdates.feedType}-${postDataUpdates.postId}`
    return e
      .update(e.Post, () => ({
        filter_single: { uniqueId },
        set: { ...postDataUpdates },
      }))
      .run(client)
      .then(F.ignore)
  }

  static addFeed(feedName: BaseFeed['feedName'], feedType: BaseFeed['feedName']): Promise<void> {
    return e.insert(e.Feed, { feedName, feedType }).run(client).then(F.ignore)
  }

  static getAllFeeds(): Promise<readonly BaseFeed[]> {
    return e.select(e.Feed, f => ({ ...feedShapeSansIdSansDBLinks(f) })).run(client)
  }

  static getSingleFeed(feedName: BaseFeed['feedName'], feedType: BaseFeed['feedName']) {
    const feedId = `${feedName}-${feedType}`
    return e
      .select(e.Feed, f => ({ ...feedShapeSansIdSansDBLinks(f), filter_single: { feedId: feedId } }))
      .run(client)
      .then(nullable)
  }

  static getFavouriteFeeds(): Promise<readonly BaseFeed[]> {
    return e
      .select(e.Feed, feed => ({
        ...feedShapeSansIdSansDBLinks(feed),
        filter: e.op(feed.favourited, '=', true),
      }))
      .run(client)
  }

  static getFeedsThatNeedToBeUpdated(): Promise<readonly BaseFeed[]> {
    const oneHourInMillisecs = 3_600_000
    const anHourAgo = (): number => Date.now() - oneHourInMillisecs

    return e
      .select(e.Feed, f => ({
        ...feedShapeSansIdSansDBLinks(f),
        filter: e.op(f.lastUpdated, '<', anHourAgo()),
      }))
      .run(client)
  }

  static updateFeedLastUpdatedTimeToNow(
    feedName: BaseFeed['feedName'],
    feedType: BaseFeed['feedName']
  ): Promise<void> {
    const feedId = `${feedName}-${feedType}`
    return e
      .update(e.Feed, () => ({
        filter_single: { feedId },
        set: { lastUpdated: Date.now() },
      }))
      .run(client)
      .then(F.ignore)
  }

  // TODO: would a backlink help here? https://www.edgedb.com/docs/intro/schema#backlinks
  // static getFeedTagsAssociatedWithFeed() {
  //   return e.select()
  // }

  static getAllFeedTags(): Promise<readonly BaseTag[]> {
    return e.select(e.Tag, t => ({ ...tagShapeSansIdSansDBLinks(t) })).run(client)
  }

  static getAllTags(): Promise<readonly BaseTag[]> {
    return e.select(e.Tag, t => ({ ...tagShapeSansIdSansDBLinks(t) })).run(client)
  }

  static getSingleTag({ tag }: { readonly tag: string }): Promise<Maybe<BaseTag>> {
    return e
      .select(e.Tag, t => ({ ...tagShapeSansIdSansDBLinks(t), filter_single: { tag } }))
      .run(client)
      .then(nullable)
  }

  static getFavouriteTags(): Promise<readonly BaseTag[]> {
    return e
      .select(e.Tag, tag => ({
        ...tagShapeSansIdSansDBLinks(tag),
        filter: e.op(tag.favourited, '=', true),
      }))
      .run(client)
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
