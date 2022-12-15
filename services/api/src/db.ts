// import path from 'path'

import { nullable } from 'pratica'
import { F } from '@mobily/ts-belt'
import type { MarkRequired } from 'ts-essentials'
import { createClient } from 'edgedb'

// import { getEnvFilePath, mainDBName } from './utils'
import type { Post } from './Entities/Post'
import type { Log, LogTable } from './Entities/Log'
import type { Settings } from './Entities/Settings'
import { EE } from './events'
import type { Subreddit } from './Entities/Subreddit'
import { getDbName } from './utils'
// import type { Database } from './Entities/AllDBTableTypes'

const client = createClient({ database: getDbName() })

const settingsColumnsToReturn = [
  'numberMediaDownloadsAtOnce',
  'numberImagesProcessAtOnce',
  'updateAllDay',
  'updateStartingHour',
  'updateEndingHour',
  'imageCompressionQuality',
  'archiveImageCompressionQuality',
  'maxImageWidthForNonArchiveImage',
  'hasSeenWelcomeMessage',
] as const

/*****
  NOTE: return a Maybe (nullable) if its a read query for a single item
*****/
// class DB {
//   readonly close = ridoDB.destroy

//   getSettings() {
//     return (
//       ridoDB
//         .selectFrom('Settings')
//         .select(settingsColumnsToReturn)
//         .where('Settings.uniqueId', '=', 'settings')
//         .executeTakeFirst()
//         // dont need Maybe here as settings will always be there
//         .then(settings => settings as Settings)
//     )
//   }

//   updateSettings(setting: Partial<Settings>) {
//     return (
//       ridoDB
//         .updateTable('Settings')
//         .set(setting)
//         .where('uniqueId', '=', 'settings')
//         .returning(settingsColumnsToReturn)
//         .executeTakeFirst()
//         // because we are doing some thing here in the db method, the normal dbOutputValCasting would not be run untill after the EE.emit, do need to call manually
//         .then(updatedSettings => dbOutputValCasting(updatedSettings) as Settings)
//         .then((updatedSettings: Settings) => {
//           EE.emit('settingsUpdate', updatedSettings)
//         })
//     )
//   }

//   saveLog(log: Log) {
//     return ridoDB.insertInto('Log').values(log).execute().then(F.ignore)
//   }

//   getAllLogs_Paginated(page: number, limit: number) {
//     const skip = page === 1 ? 0 : (page - 1) * limit

//     return ridoDB
//       .selectFrom('Log')
//       .selectAll()
//       .offset(skip)
//       .limit(limit)
//       .orderBy('createdAt', 'desc')
//       .execute()
//   }

//   findLogs_AllLevels_WithSearch_Paginated(page: number, limit: number, searchQuery: string) {
//     const skip = page === 1 ? 0 : (page - 1) * limit

//     return ridoDB
//       .selectFrom('Log')
//       .selectAll()
//       .where('message', 'like', `%${searchQuery}%`)
//       .orWhere('service', 'like', `%${searchQuery}%`)
//       .orWhere('error', 'like', `%${searchQuery}%`)
//       .orWhere('other', 'like', `%${searchQuery}%`)
//       .offset(skip)
//       .limit(limit)
//       .orderBy('createdAt', 'desc')
//       .execute()
//   }

//   findLogs_LevelFilter_NoSearch_Paginated(page: number, limit: number, logLevel: Log['level']) {
//     const skip = page === 1 ? 0 : (page - 1) * limit

//     return ridoDB
//       .selectFrom('Log')
//       .selectAll()
//       .where('level', '=', logLevel)
//       .offset(skip)
//       .limit(limit)
//       .orderBy('createdAt', 'desc')
//       .execute()
//   }

//   findLogs_LevelFilter_WithSearch_Paginated(
//     page: number,
//     limit: number,
//     searchQuery: string,
//     logLevel: Log['level']
//   ) {
//     const skip = page === 1 ? 0 : (page - 1) * limit
//     //NOTE: kysely doesnt seem to have an andWhere method like knex to put multiple wheres in parenthesis. e.g. https://knexjs.org/faq/recipes.html#using-parentheses-with-and-operator, so gotta use sql function

//     // This needs to be like this as kysely will wrap in quotes (dont want it to wrap inside the %)
//     const sq = `%${searchQuery}%`

//     return sql<LogTable>`select * from "Log" WHERE "level" = ${logLevel} AND ("message" LIKE ${sq} OR "service" LIKE ${sq} or "error" LIKE ${sq} or "other" LIKE ${sq}) ORDER BY "createdAt" DESC LIMIT ${limit} OFFSET ${skip}`
//       .execute(ridoDB)
//       .then(results => results.rows)
//   }

//   getAllPosts() {
//     return ridoDB.selectFrom('Post').selectAll().execute()
//   }

//   getSinglePost(postId: Post['postId']) {
//     return ridoDB
//       .selectFrom('Post')
//       .selectAll()
//       .where('postId', '=', postId)
//       .executeTakeFirst()
//       .then(nullable)
//   }

//   addPost(post: Post) {
//     return Promise.all([
//       ridoDB.insertInto('Post').values(post).execute(),
//       ridoDB
//         .insertInto('Subreddit_Post')
//         .values({ subreddit: post.subreddit, postId: post.postId })
//         .execute(),
//     ]).then(F.ignore)
//   }

//   batchAddPosts(posts: readonly Post[]) {
//     const postsSubMapping = posts.map(post => ({ subreddit: post.subreddit, postId: post.postId }))

//     return Promise.all([
//       ridoDB.insertInto('Post').values(posts).execute(),
//       ridoDB.insertInto('Subreddit_Post').values(postsSubMapping).execute(),
//     ]).then(F.ignore)
//   }

//   fetchAllPostIds() {
//     return ridoDB
//       .selectFrom('Post')
//       .select('postId')
//       .execute()
//       .then(results => results.map(result => result.postId))
//   }

//   getPostsThatNeedMediaToBeDownloaded() {
//     return ridoDB
//       .selectFrom('Post')
//       .select(['postId', 'mediaUrl', 'mediaDownloadTries'])
//       .where('mediaHasBeenDownloaded', '=', SQLiteBoolFalse)
//       .where('couldNotDownload', '=', SQLiteBoolFalse)
//       .execute()
//   }

//   getPostsWhereImagesNeedToBeOptimized() {
//     return ridoDB
//       .selectFrom('Post')
//       .selectAll()
//       .where('mediaHasBeenDownloaded', '=', SQLiteBoolTrue)
//       .where('couldNotDownload', '=', SQLiteBoolFalse)
//       .where('postMediaImagesHaveBeenProcessed', '=', SQLiteBoolFalse)
//       .execute()
//   }

//   updatePostInfo(postDataUpdates: MarkRequired<Partial<Post>, 'postId'>) {
//     return ridoDB
//       .updateTable('Post')
//       .where('postId', '=', postDataUpdates.postId)
//       .set(postDataUpdates)
//       .execute()
//       .then(F.ignore)
//   }

//   addSubreddit(subreddit: Subreddit['subreddit']) {
//     return ridoDB.insertInto('Subreddit').values({ subreddit }).execute().then(F.ignore)
//   }

//   getAllSubreddits() {
//     return ridoDB.selectFrom('Subreddit').selectAll().execute()
//   }

//   getSingleSubreddit({ subreddit }: { readonly subreddit: string }) {
//     return ridoDB.selectFrom('Subreddit').selectAll().where('subreddit', '=', subreddit).execute()
//   }

//   getFavouriteSubreddits() {
//     return ridoDB.selectFrom('Subreddit').selectAll().where('favourited', '=', SQLiteBoolTrue).execute()
//   }

//   getAllSubredditGroups() {
//     return ridoDB.selectFrom('SubGroup').selectAll().execute()
//   }

//   getSingleSubredditGroup({ subGroup }: { readonly subGroup: string }) {
//     return ridoDB.selectFrom('SubGroup').selectAll().where('subGroup', '=', subGroup).execute()
//   }

//   getFavouriteSubredditGroups() {
//     return ridoDB.selectFrom('SubGroup').selectAll().where('favourited', '=', SQLiteBoolTrue).execute()
//   }

//   getSubredditGroupsAssociatedWithSubreddit() {
//     return ridoDB.selectFrom('Subreddit_SubGroup').innerJoin()
//   }

//   getSubsThatNeedToBeUpdated() {
//     const oneHourInMillisecs = 3_600_000
//     const anHourAgo = (): number => Date.now() - oneHourInMillisecs
//     return ridoDB.selectFrom('Subreddit').selectAll().where('lastUpdated', '<', anHourAgo()).execute()
//   }

//   updateSubredditLastUpdatedTimeToNow(subreddit: Subreddit['subreddit']) {
//     return ridoDB
//       .updateTable('Subreddit')
//       .where('subreddit', '=', subreddit)
//       .set({ lastUpdated: Date.now() })
//       .execute()
//       .then(F.ignore)
//   }

//   getAllTags() {
//     return ridoDB.selectFrom('Tag').selectAll().execute()
//   }

//   getSingleTag({ tag }: { readonly tag: string }) {
//     return ridoDB.selectFrom('Tag').selectAll().where('tag', '=', tag).execute()
//   }

//   getFavouriteTags() {
//     return ridoDB.selectFrom('Tag').selectAll().where('favourited', '=', SQLiteBoolTrue).execute()
//   }
// }

const delay = (): Promise<unknown> =>
  new Promise(resolve => {
    setTimeout(resolve)
  })

// eslint-disable-next-line max-lines-per-function
const thing = (): Promise<void | readonly void[]> =>
  // console.log(DB.thing2())
  // DB.getAllPosts()
  client
    .querySingle(`select random()`)
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

export { thing }
