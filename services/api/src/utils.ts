import path from 'path'

import { DateTime } from 'luxon'
import { z } from 'zod'

const isDev = (): boolean => process.env['NODE_ENV'] !== 'production'

const isAbsolutePath = (pth = ''): boolean => pth.startsWith('/')

// start from project root, not sub project process cwd
const getEnvFilePath = (pth = ''): string =>
  isAbsolutePath(pth) ? pth : path.resolve(process.cwd(), '..', '..', pth)

const isInTesting = process.env['NODE_ENV'] === 'test'

const mainDBName = (): string => (isInTesting ? 'RIDO-Test' : 'RIDO')

const logsDBName = (): string => (isInTesting ? 'RIDO-Test-logs' : 'RIDO-logs')

/*****
  The posts timestamp is in seconds since the epoch and is UTC 0. So we need to convert
  the date we received from the frontend from the local date to UTC 0 (aka GMT) and to
  seconds since the epoch.
*****/
const localDateToGMTEpoch = (d: Date): number => DateTime.fromJSDate(d).setZone('GMT').toSeconds()

// https://github.com/koskimas/kysely/issues/123#issuecomment-1194334428
const SqliteBoolean = z
  .number()
  // .refine(n => n === 0 || n === 1)
  .brand<'SqliteBoolean'>()

type SqliteBooleanType = z.infer<typeof SqliteBoolean>

const sqliteBooleanTrue = 1 as SqliteBooleanType
const sqliteBooleanFalse = 0 as SqliteBooleanType

const castBoolToSqliteBool = (bool: boolean): SqliteBooleanType => {
  if (typeof bool !== 'boolean') throw new Error('bool is not a boolean')

  return bool === true ? sqliteBooleanTrue : sqliteBooleanFalse
}

const castSqliteBoolToRegularBool = (sqliteBoolNum: number): boolean => {
  if (sqliteBoolNum !== 1 && sqliteBoolNum !== 0) throw new Error('sqliteBoolNum needs to be a 0 or a 1')

  return sqliteBoolNum === 1
}

export {
  isDev,
  getEnvFilePath,
  mainDBName,
  logsDBName,
  isInTesting,
  localDateToGMTEpoch,
  castBoolToSqliteBool,
  castSqliteBoolToRegularBool,
}

export type { SqliteBooleanType }
