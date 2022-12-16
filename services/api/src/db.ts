// import path from 'path'

import { nullable, type Maybe } from 'pratica'
import { F } from '@mobily/ts-belt'
import type { MarkRequired } from 'ts-essentials'
import { createClient } from 'edgedb'

import { EE } from './events'
import e from '../dbschema/edgeql-js'
import type { Settings, Log, Post, Subreddit, SubredditGroup, Tag } from '../dbschema/interfaces'

const client = createClient()

const settingsColumnsToReturn = [
  'numberMediaDownloadsAtOnce',
  'numberImagesProcessAtOnce',
  'updateAllDay',
  'updateStartingHour',
  'updateEndingHour',
  'imageCompressionQuality',
  'archiveImageCompressionQuality',
  'maxImageWidthForNonArchiveImage',
] as const

type PostSansDBLinks = Omit<Post, 'subreddit' | 'tags'>
type SubredditSansDBLinks = Omit<Subreddit, 'posts' | 'groups'>
type SubredditGroupSansDBLinks = Omit<SubredditGroup, 'subreddits'>
type TagSansDBLinks = Omit<Tag, 'posts'>

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
        .select(e.Settings, () => ({
          ...e.Settings['*'],
          filter_single: { uniqueId: 'settings' },
        }))
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
          .select(e.Settings, () => ({
            numberMediaDownloadsAtOnce: true,
            numberImagesProcessAtOnce: true,
            updateAllDay: true,
            updateStartingHour: true,
            updateEndingHour: true,
            imageCompressionQuality: true,
            archiveImageCompressionQuality: true,
            maxImageWidthForNonArchiveImage: true,
            filter_single: { uniqueId: 'settings' },
          }))
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

  // static findLogs_AllLevels_WithSearch_Paginated(page: number, limit: number, searchQuery: string) {
  //   const skip = page === 1 ? 0 : (page - 1) * limit

  //   return ridoDB
  //     .selectFrom('Log')
  //     .selectAll()
  //     .where('message', 'like', `%${searchQuery}%`)
  //     .orWhere('service', 'like', `%${searchQuery}%`)
  //     .orWhere('error', 'like', `%${searchQuery}%`)
  //     .orWhere('other', 'like', `%${searchQuery}%`)
  //     .offset(skip)
  //     .limit(limit)
  //     .orderBy('createdAt', 'desc')
  //     .execute()
  // }

  // static findLogs_LevelFilter_NoSearch_Paginated(page: number, limit: number, logLevel: Log['level']) {
  //   const skip = page === 1 ? 0 : (page - 1) * limit

  //   return ridoDB
  //     .selectFrom('Log')
  //     .selectAll()
  //     .where('level', '=', logLevel)
  //     .offset(skip)
  //     .limit(limit)
  //     .orderBy('createdAt', 'desc')
  //     .execute()
  // }

  // static findLogs_LevelFilter_WithSearch_Paginated(
  //   page: number,
  //   limit: number,
  //   searchQuery: string,
  //   logLevel: Log['level']
  // ) {
  //   const skip = page === 1 ? 0 : (page - 1) * limit
  //   //NOTE: kysely doesnt seem to have an andWhere method like knex to put multiple wheres in parenthesis. e.g. https://knexjs.org/faq/recipes.html#using-parentheses-with-and-operator, so gotta use sql function

  //   // This needs to be like this as kysely will wrap in quotes (dont want it to wrap inside the %)
  //   const sq = `%${searchQuery}%`

  //   return sql<LogTable>`select * from "Log" WHERE "level" = ${logLevel} AND ("message" LIKE ${sq} OR "service" LIKE ${sq} or "error" LIKE ${sq} or "other" LIKE ${sq}) ORDER BY "createdAt" DESC LIMIT ${limit} OFFSET ${skip}`
  //     .execute(ridoDB)
  //     .then(results => results.rows)
  // }

  static getAllPosts(): Promise<readonly PostSansDBLinks[]> {
    return e.select(e.Post, () => ({ ...e.Post['*'] })).run(client)
  }

  static getSinglePost(postId: Post['postId']): Promise<Maybe<PostSansDBLinks>> {
    return e
      .select(e.Post, () => ({ ...e.Post['*'], filter_single: { postId } }))
      .run(client)
      .then(nullable)
  }

  static addPost(post: PostSansDBLinks): Promise<void> {
    return e.insert(e.Post, post).run(client).then(F.ignore)
  }

  // static batchAddPosts(posts: readonly Post[]) {
  //   const postsSubMapping = posts.map(post => ({ subreddit: post.subreddit, postId: post.postId }))

  //   return Promise.all([
  //     ridoDB.insertInto('Post').values(posts).execute(),
  //     ridoDB.insertInto('Subreddit_Post').values(postsSubMapping).execute(),
  //   ]).then(F.ignore)
  // }

  static fetchAllPostIds(): Promise<readonly Post['postId'][]> {
    return e
      .select(e.Post, () => ({ postId: true }))
      .run(client)
      .then(results => results.map(result => result.postId))
  }

  static getPostsThatNeedMediaToBeDownloaded() {
    return e
      .select(e.Post, post => ({
        postId: true,
        mediaUrl: true,
        mediaDownloadTries: true,
        filter: e.op(post.mediaHasBeenDownloaded, '=', false, 'and', post.couldNotDownload, '=', false),
        filter: e.op(post.couldNotDownload, '=', false),
        // filter: { mediaHasBeenDownloaded: false, couldNotDownload: false },
      }))
      .run(client)
  }

  // static getPostsWhereImagesNeedToBeOptimized() {
  //   return ridoDB
  //     .selectFrom('Post')
  //     .selectAll()
  //     .where('mediaHasBeenDownloaded', '=', SQLiteBoolTrue)
  //     .where('couldNotDownload', '=', SQLiteBoolFalse)
  //     .where('postMediaImagesHaveBeenProcessed', '=', SQLiteBoolFalse)
  //     .execute()
  // }

  static updatePostInfo(postDataUpdates: MarkRequired<Partial<PostSansDBLinks>, 'postId'>): Promise<void> {
    return e
      .update(e.Post, () => ({
        filter_single: { postId: postDataUpdates.postId },
        set: { ...postDataUpdates },
      }))
      .run(client)
      .then(F.ignore)
  }

  static addSubreddit(subreddit: SubredditSansDBLinks['subreddit']): Promise<void> {
    return e.insert(e.Subreddit, { subreddit }).run(client).then(F.ignore)
  }

  static getAllSubreddits(): Promise<readonly SubredditSansDBLinks[]> {
    return e.select(e.Subreddit, () => ({ ...e.Subreddit['*'] })).run(client)
  }

  static getSingleSubreddit({
    subreddit,
  }: {
    readonly subreddit: string
  }): Promise<Maybe<SubredditSansDBLinks>> {
    return e
      .select(e.Subreddit, () => ({ ...e.Subreddit['*'], filter_single: { subreddit } }))
      .run(client)
      .then(nullable)
  }

  static getFavouriteSubreddits(): Promise<readonly SubredditSansDBLinks[]> {
    return e
      .select(e.Subreddit, sub => ({
        ...e.Subreddit['*'],
        filter: e.op(sub.favourited, '=', true),
      }))
      .run(client)
  }

  static getAllSubredditGroups(): Promise<readonly SubredditGroupSansDBLinks[]> {
    return e.select(e.SubredditGroup, () => ({ ...e.SubredditGroup['*'] })).run(client)
  }

  static getSingleSubredditGroup({
    subGroup,
  }: {
    readonly subGroup: string
  }): Promise<Maybe<SubredditGroupSansDBLinks>> {
    return e
      .select(e.SubredditGroup, () => ({ ...e.SubredditGroup['*'], filter_single: { subGroup } }))
      .run(client)
      .then(nullable)
  }

  static getFavouriteSubredditGroups(): Promise<readonly SubredditGroupSansDBLinks[]> {
    return e
      .select(e.SubredditGroup, sg => ({
        ...e.SubredditGroup['*'],
        filter: e.op(sg.favourited, '=', true),
      }))
      .run(client)
  }

  // static getSubredditGroupsAssociatedWithSubreddit() {
  //
  // }

  // static getSubsThatNeedToBeUpdated() {
  //   const oneHourInMillisecs = 3_600_000
  //   const anHourAgo = (): number => Date.now() - oneHourInMillisecs
  //   return ridoDB.selectFrom('Subreddit').selectAll().where('lastUpdated', '<', anHourAgo()).execute()
  // }

  // static updateSubredditLastUpdatedTimeToNow(subreddit: Subreddit['subreddit']) {
  //   return ridoDB
  //     .updateTable('Subreddit')
  //     .where('subreddit', '=', subreddit)
  //     .set({ lastUpdated: Date.now() })
  //     .execute()
  //     .then(F.ignore)
  // }

  static getAllTags(): Promise<readonly TagSansDBLinks[]> {
    return e.select(e.Tag, () => ({ ...e.Tag['*'] })).run(client)
  }

  static getSingleTag({ tag }: { readonly tag: string }): Promise<Maybe<TagSansDBLinks>> {
    return e
      .select(e.Tag, () => ({ ...e.Tag['*'], filter_single: { tag } }))
      .run(client)
      .then(nullable)
  }

  static getFavouriteTags(): Promise<readonly TagSansDBLinks[]> {
    return e
      .select(e.Tag, tag => ({
        ...e.Tag['*'],
        filter: e.op(tag.favourited, '=', true),
      }))
      .run(client)
  }
}

const delay = (): Promise<unknown> =>
  new Promise(resolve => {
    setTimeout(resolve)
  })

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
