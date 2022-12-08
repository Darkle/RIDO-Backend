import { readFileSync } from 'node:fs'
import path from 'path'

import * as R from 'ramda'
import { match, P } from 'ts-pattern'

import sqliteParser from 'sqlite-parser'
import type { SQLFileParserReturnType } from './types'

const uJSONParse = R.unary(JSON.parse)
const uJSONStringify = R.unary(JSON.stringify)

/*****
now that i think about it, it might be alright to auto json.parse here cause when will i be getting thousands of posts at once? That wont happen on the front-end, and even when i do need to do that for the services, I will not be getting the json data columns for that (eg getting all posts that need to be downloaded)
*****/

const ridoLogsDBSqlFileData = readFileSync(
  path.resolve(process.cwd(), '..', '..', 'db-init-scripts', 'init-logging-db.sql')
).toString()

const ridoDBSqlFileData = readFileSync(
  path.resolve(process.cwd(), '..', '..', 'db-init-scripts', 'init-rido-db.sql')
).toString()

const logsDBSQL = sqliteParser(ridoLogsDBSqlFileData) as SQLFileParserReturnType
const ridoDBSQL = sqliteParser(ridoDBSqlFileData) as SQLFileParserReturnType

const getAllDataColmnsOfCertainType = (dbSql: SQLFileParserReturnType, type: string): readonly string[] =>
  dbSql.statement
    .flatMap(statement =>
      statement.variant !== 'create'
        ? []
        : statement?.definition?.filter(definition => definition.datatype?.variant === type)
    )
    .map(definition => definition.name)

const jsonColumnsForAllDBs = [
  ...getAllDataColmnsOfCertainType(logsDBSQL, 'json'),
  ...getAllDataColmnsOfCertainType(ridoDBSQL, 'json'),
].flat()

const booleanColumnsForAllDBs = [
  ...getAllDataColmnsOfCertainType(logsDBSQL, 'boolean'),
  ...getAllDataColmnsOfCertainType(ridoDBSQL, 'boolean'),
].flat()

type Transformer = ((jsonString: string) => unknown) | ((bool: boolean) => number) | BooleanConstructor

const convertColumnNamesToTransforms = (
  columns: readonly string[],
  transformer: Transformer
): Record<string, typeof transformer> =>
  columns.reduce(
    (accumulator, column) => ({
      ...accumulator,
      [column]: transformer,
    }),
    {}
  )

const boolToSQLiteBool = (bool: boolean): number => (bool === true ? 1 : 0)

const outputTransformations = {
  ...convertColumnNamesToTransforms(jsonColumnsForAllDBs, uJSONParse),
  ...convertColumnNamesToTransforms(booleanColumnsForAllDBs, Boolean),
}

const inputTransformations = {
  ...convertColumnNamesToTransforms(jsonColumnsForAllDBs, uJSONStringify),
  ...convertColumnNamesToTransforms(booleanColumnsForAllDBs, boolToSQLiteBool),
}

/*****
  When using .pluck('foo') in knex and the pluck is getting either boolean values or json values, we use a query context
   to tell our postProcessResponse to convert it (since pluck just returns an array of values with no key name, which would otherwise make it impossible to know when to convert it).
*****/
// [(_, queryContext) => queryContext?.plucking === 'boolean', R.map(Boolean)],
// [(_, queryContext) => queryContext?.plucking === 'json', R.map(uJSONParse)],

const dbOutputValCasting = R.cond([
  [Array.isArray, R.map(R.when(R.is(Object), R.evolve(outputTransformations)))],
  // @ts-expect-error bloody ramda and types again
  [R.is(Object), R.evolve(outputTransformations)],
  [R.T, R.identity],
])

const dbInputValCasting = R.cond([
  [Array.isArray, R.map(R.when(R.is(Object), R.evolve(inputTransformations)))],
  // @ts-expect-error bloody ramda and types again
  [R.is(Object), R.evolve(inputTransformations)],
  [R.T, R.identity],
])

export { dbOutputValCasting, dbInputValCasting }
