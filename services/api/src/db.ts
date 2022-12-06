import path from 'path'

import {
  type InsertResult,
  // type ValueNode,
  // type KyselyPlugin,
  // type PluginTransformQueryArgs,
  // type RootOperationNode,
  // type QueryResult,
  // type PluginTransformResultArgs,
  // type UnknownRow,
  // OperationNodeTransformer,
  Kysely,
  SqliteDialect,
} from 'kysely'
import betterSqlite from 'better-sqlite3'

import { castBoolToSqliteBool, getEnvFilePath, logsDBName, mainDBName } from './utils'
import type { LogTable } from './Entities/Log'
import type { TraceLogTable } from './Entities/TraceLog'
import type { PostTable } from './Entities/Post'
import type { SettingsTable } from './Entities/Settings'
import type { SubGroupTable } from './Entities/SubGroup'
import type { Subreddit, SubredditTable } from './Entities/Subreddit'
import type { TagTable } from './Entities/Tag'
import type { Subreddit_Post } from './Entities/Subreddit_Post'
import type { Subreddit_SubGroup } from './Entities/Subreddit_SubGroup'
import type { Tag_Post } from './Entities/Tag_Post'

interface LogsDatabase {
  readonly Log: LogTable
  readonly TraceLog: TraceLogTable
}

const logsDBFilePath = path.join(getEnvFilePath(process.env['DATA_FOLDER']), `${logsDBName()}.db`)

const connectionOptions = process.env['LOG_DB_QUERIES'] === 'true' ? { verbose: console.log } : {}

const logsDBConnection = betterSqlite(logsDBFilePath, connectionOptions)

const logsDB = new Kysely<LogsDatabase>({
  dialect: new SqliteDialect({ database: logsDBConnection }),
})

interface RidoDatabase {
  readonly Post: PostTable
  readonly Settings: SettingsTable
  readonly SubredditGroup: SubGroupTable
  readonly Subreddit: SubredditTable
  readonly Tag: TagTable
  readonly Subreddit_Post: Subreddit_Post
  readonly Subreddit_SubGroup: Subreddit_SubGroup
  readonly Tag_Post: Tag_Post
}

const ridoDBFilePath = path.join(getEnvFilePath(process.env['DATA_FOLDER']), `${mainDBName()}.db`)

const ridoDBConnection = betterSqlite(ridoDBFilePath, connectionOptions)

// class SqliteBooleanTransformer extends OperationNodeTransformer {
//   transformValue(node: ValueNode): ValueNode {
//     return {
//       ...super.transformValue(node),
//       value: typeof node.value === 'boolean' ? (node.value ? 1 : 0) : node.value,
//     }
//   }
// }

// export class SqliteBooleanPlugin implements KyselyPlugin {
//   readonly #transformer = new SqliteBooleanTransformer()

//   transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
//     return this.#transformer.transformNode(args.node)
//   }

//   transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
//     return Promise.resolve(args.result)
//   }
// }

const DB = new Kysely<RidoDatabase>({
  dialect: new SqliteDialect({ database: ridoDBConnection }),
})
// .withPlugin(new SqliteBooleanPlugin())

const thing = () =>
  DB.selectFrom('Subreddit')
    .selectAll()
    .executeTakeFirst()
    .then(result => {
      if (!result) throw 'asd'
      const favourited = result.favourited === 1
      return { ...result, favourited } as Subreddit
    })
    .then(asd => asd)
    .catch(err => console.error(err))

// const thing = (): Promise<InsertResult> =>
//   DB.insertInto('Subreddit')
//     .values({ favourited: castBoolToSqliteBool(false), subreddit: 'merp', lastUpdated: 1 })
//     .executeTakeFirst()

export { logsDB, DB, thing }
