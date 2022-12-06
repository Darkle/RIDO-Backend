import path from 'path'

import knex from 'knex'

import { getEnvFilePath, logsDBName, mainDBName } from './utils'
import type { Log } from './Entities/Log'
import type { TraceLog } from './Entities/TraceLog'
import type { Post } from './Entities/Post'
import type { Settings } from './Entities/Settings'
import type { SubGroup } from './Entities/SubGroup'
import type { Subreddit } from './Entities/Subreddit'
import type { Tag } from './Entities/Tag'
import type { Subreddit_Post } from './Entities/Subreddit_Post'
import type { Subreddit_SubGroup } from './Entities/Subreddit_SubGroup'
import type { Tag_Post } from './Entities/Tag_Post'

// const connectionOptions = process.env['LOG_DB_QUERIES'] === 'true' ? { verbose: console.log } : {}

const logsDBFilePath = path.join(getEnvFilePath(process.env['DATA_FOLDER']), `${logsDBName()}.db`)
const ridoDBFilePath = path.join(getEnvFilePath(process.env['DATA_FOLDER']), `${mainDBName()}.db`)

const logsDB = knex({ client: 'sqlite3', connection: { filename: logsDBFilePath, flags: ['foreign_keys'] } })
const ridoDB = knex({ client: 'sqlite3', connection: { filename: ridoDBFilePath, flags: ['foreign_keys'] } })

// const thing = () =>
//   DB.selectFrom('Subreddit')
//     .selectAll()
//     .executeTakeFirst()
//     .then(result => {
//       if (!result) throw 'asd'
//       const favourited = result.favourited === 1
//       return { ...result, favourited } as Subreddit
//     })
//     .then(asd => asd)
//     .catch(err => console.error(err))

// const thing = (): Promise<InsertResult> =>
//   DB.insertInto('Subreddit')
//     .values({ favourited: castBoolToSqliteBool(false), subreddit: 'merp', lastUpdated: 1 })
//     .executeTakeFirst()

export {}
