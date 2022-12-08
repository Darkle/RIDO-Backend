import path from 'path'

import knex from 'knex'

import { getEnvFilePath, isDev, mainDBName } from './utils'
import { castValues } from './dbValueCasting'
import type { Post } from './Entities/Post'

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

class DBMethods {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return castValues(this)
  }

  getAllPosts(): Promise<readonly Post[]> {
    return ridoDB('Post').select('*')
  }

  addPost(post: Post): Promise<void> {
    return ridoDB('Post').insert(post)
  }

  thing(): void {
    console.log('in thing')
  }
}

const DB = new DBMethods()

// eslint-disable-next-line max-lines-per-function
const thing = (): void => {
  // DB.thing()
  DB.getAllPosts()
    // DB.addPost({
    //   post_id: 'asd',
    //   could_not_download: false,
    //   downloaded_media: ['asd.png'],
    //   downloaded_media_count: 0,
    //   media_download_tries: 0,
    //   media_has_been_downloaded: false,
    //   media_url: 'http://asd.com',
    //   post_media_images_have_been_processed: false,
    //   post_thumbnails_created: false,
    //   post_url: 'http://xcv.com',
    //   score: 2,
    //   subreddit: 'merp',
    //   timestamp: 3,
    //   title: 'hello',
    // })
    .then(result => {
      console.log(result)
      console.log('finished db')
    })
    .catch(err => {
      console.log('caught in catch:')
      console.error(err)
    })
  // DB.getAllPosts({
  //   post_id: 'asd',
  //   could_not_download: false,
  //   downloaded_media: ['asd.png'],
  //   downloaded_media_count: 0,
  //   media_download_tries: 0,
  //   media_has_been_downloaded: false,
  //   media_url: 'http://asd.com',
  //   post_media_images_have_been_processed: false,
  //   post_thumbnails_created: false,
  //   post_url: 'http://xcv.com',
  //   score: 2,
  //   subreddit: 'merp',
  //   timestamp: 3,
  //   title: 'hello',
  // })
  //   .then(() => {
  //     console.log('finished db')
  //   })
  //   .catch(err => {
  //     console.log('caught in catch:')
  //     console.error(err)
  //   })
}

// ridoDB<Subreddit>('Subreddit')
// .insert({ subreddit: 'merp' })
// .then(result => console.log(result))
// .catch(err => console.error(err))
// .then(() =>
// ridoDB<PostForReadyForDB>('Post')
//   .insert({
//     post_id: 'asd',
//     could_not_download: false,
//     downloaded_media: ['asd.png'],
//     downloaded_media_count: 0,
//     media_download_tries: 0,
//     media_has_been_downloaded: false,
//     media_url: 'http://asd.com',
//     post_media_images_have_been_processed: false,
//     post_thumbnails_created: false,
//     post_url: 'http://xcv.com',
//     score: 2,
//     subreddit: 'merp',
//     timestamp: 3,
//     title: 'hello',
//   })
//   .then(result => console.log(result))
//   .catch(err => console.error(err))
// )

export { thing, DB }
