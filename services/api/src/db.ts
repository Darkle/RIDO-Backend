import path from 'path'

import knex from 'knex'
import { nullable, type Maybe } from 'pratica'
import { F } from '@mobily/ts-belt'

import { getEnvFilePath, isDev, mainDBName } from './utils'
import { autoCastValuesToFromDB } from './dbValueCasting'
import type { Post } from './Entities/Post'
import type { Log } from './Entities/Log'
import type { Settings, SettingsSansId } from './Entities/Settings'
import { EE } from './events'
import type { Subreddit } from './Entities/Subreddit'

const enableDBLogging = process.env['LOG_DB_QUERIES'] === 'true'

const ridoDBFilePath = path.join(getEnvFilePath(process.env['DATA_FOLDER']), `${mainDBName()}.db`)

const ridoDB = knex({
  client: 'sqlite3',
  connection: { filename: ridoDBFilePath },
  debug: enableDBLogging,
  asyncStackTraces: isDev(),
  // This is mostly to silence knex warning. We set defaults in the .sql files.
  useNullAsDefault: true,
  pool: {
    // https://github.com/knex/knex/issues/453
    afterCreate(conn: { readonly run: (sql: string, cb: () => void) => void }, cb: () => void) {
      conn.run('PRAGMA foreign_keys = ON', cb)
    },
  },
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
]

/*****
  NOTE: return a Maybe (nullable) if its a read query for a single item
*****/
class DBMethods {
  constructor() {
    return autoCastValuesToFromDB(this)
  }

  // eslint-disable-next-line extra-rules/potential-point-free
  close(): Promise<void> {
    return ridoDB.destroy()
  }

  getSettings(): Promise<SettingsSansId> {
    return ridoDB<Settings>('Settings')
      .select(settingsColumnsToReturn)
      .where({ unique_id: 'admin-settings' })
      .first<SettingsSansId>()
  }

  updateSettings(setting: Partial<Settings>): Promise<SettingsSansId> {
    return ridoDB<Settings>('Settings')
      .returning(settingsColumnsToReturn)
      .where({ unique_id: 'admin-settings' })
      .update<SettingsSansId>(setting)
      .then(updatedSettings => {
        EE.emit('settingsUpdate', updatedSettings)
        return updatedSettings
      })
  }

  saveLog(log: Log): Promise<void> {
    return ridoDB<Log>('Log').insert(log).then(F.ignore)
  }

  getAllPosts(): Promise<readonly Post[]> {
    return ridoDB<Post>('Post').select('*')
  }

  getSinglePost(post_id: Post['post_id']): Promise<Maybe<Post>> {
    return ridoDB<Post>('Post').select('*').where({ post_id }).first().then(nullable)
  }

  addPost(post: Post): Promise<void> {
    return ridoDB<Post>('Post').insert(post).then(F.ignore)
  }

  batchAddPosts(posts: readonly Post[]): Promise<void> {
    return ridoDB.batchInsert('Post', posts).then(F.ignore)
  }

  fetchAllPostIds(): Promise<readonly Post['post_id'][]> {
    return ridoDB<Post>('Post').pluck('post_id')
  }

  getPostsThatNeedMediaToBeDownloaded(): Promise<
    readonly Pick<Post, 'post_id' | 'media_url' | 'media_download_tries'>[]
  > {
    return ridoDB<Post>('Post')
      .select(['post_id', 'media_url', 'media_download_tries'])
      .where({ media_has_been_downloaded: false, could_not_download: false })
  }

  updatePostDownloadInfoOnSuccess(
    postDataUpdates: Pick<
      Post,
      | 'post_id'
      | 'media_has_been_downloaded'
      | 'could_not_download'
      | 'downloaded_media'
      | 'downloaded_media_count'
    >
  ): Promise<void> {
    return ridoDB<Post>('Post')
      .where({ post_id: postDataUpdates.post_id })
      .update(postDataUpdates)
      .then(F.ignore)
  }

  updatePostDownloadInfoOnError(
    postDataUpdates: Pick<
      Post,
      | 'post_id'
      | 'media_has_been_downloaded'
      | 'could_not_download'
      | 'download_error'
      | 'media_download_tries'
    >
  ): Promise<void> {
    return ridoDB<Post>('Post')
      .where({ post_id: postDataUpdates.post_id })
      .update(postDataUpdates)
      .then(F.ignore)
  }

  addSubreddit(subreddit: Subreddit): Promise<void> {
    return ridoDB<Subreddit>('Subreddit').insert(subreddit).then(F.ignore)
  }

  getSubsThatNeedToBeUpdated(): Promise<readonly Subreddit[]> {
    const oneHourInMillisecs = 3_600_000
    const anHourAgo = (): number => Date.now() - oneHourInMillisecs
    return ridoDB<Subreddit>('Subreddit').where('last_updated', '<', anHourAgo())
  }

  updateSubredditLastUpdatedTimeToNow(subreddit: Subreddit['subreddit']): Promise<void> {
    return ridoDB<Subreddit>('Subreddit')
      .where({ subreddit })
      .update({ last_updated: Date.now() })
      .then(F.ignore)
  }

  // thing(): Promise<ReadonlyArray<Pick<Post, 'post_id' | 'title'>>> {
  //   return knex<Post>('users').select('post_id').select('title')
  //   // .then(users => {
  //   //   // Type of users is inferred as Pick<User, "id" | "age">[]
  //   //   // Do something with users
  //   // })
  // }
}

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
