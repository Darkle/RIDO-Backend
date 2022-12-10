import path from 'path'

import knex from 'knex'
import { nullable, type Maybe } from 'pratica'
import { D } from '@mobily/ts-belt'

import { getEnvFilePath, isDev, mainDBName } from './utils'
import { autoCastValuesToFromDB } from './dbValueCasting'
import type { Post } from './Entities/Post'
import type { Log } from './Entities/Log'
import type { Settings, SettingsSansId } from './Entities/Settings'
import { EE } from './events'

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

  updateSettings(setting: Partial<Settings>): Promise<SettingsSansId> {
    return ridoDB<Settings>('Settings')
      .returning('*')
      .where({ unique_id: 'admin-settings' })
      .update<readonly [Settings]>(setting)
      .then(results => D.deleteKey(results[0], 'unique_id'))
      .then(updatedSettings => {
        EE.emit('settingsUpdate', updatedSettings)
        return updatedSettings
      })
  }

  saveLog(log: Log): Promise<void> {
    return ridoDB<Log>('Log').insert(log)
  }

  getAllPosts(): Promise<readonly Post[]> {
    return ridoDB<Post>('Post').select('*')
  }

  getSinglePost(post_id: Post['post_id']): Promise<Maybe<Post>> {
    return ridoDB<Post>('Post').select('*').where({ post_id }).first().then(nullable)
  }

  addPost(post: Post): Promise<void> {
    return ridoDB('Post').insert(post)
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
