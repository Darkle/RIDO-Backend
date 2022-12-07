import { readFileSync } from 'node:fs'
import path from 'path'

import * as R from 'ramda'
// import { evolve } from 'rambda'

import sqliteParser from 'sqlite-parser'
import type { SQLFileParserReturnType } from './types'

const uJSONParse = R.unary(JSON.parse)

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

const convertColumnNamesToTransforms = (
  columns: readonly string[],
  transformer: (a: string) => unknown | BooleanConstructor
): Record<string, typeof transformer> =>
  columns.reduce(
    (accumulator, column) => ({
      ...accumulator,
      [column]: transformer,
    }),
    {}
  )

const transformations = {
  ...convertColumnNamesToTransforms(jsonColumnsForAllDBs, uJSONParse),
  ...convertColumnNamesToTransforms(booleanColumnsForAllDBs, Boolean),
}

/*****
  When using .pluck('foo') in knex and the pluck is getting either boolean values or json values, we use a query context
   to tell our postProcessResponse to convert it (since pluck just returns an array of values with no key name, which would otherwise make it impossible to know when to convert it).
*****/
const castValues = R.evolve(transformations)

const dbOutputCasting = R.cond([
  // [(_, queryContext) => queryContext?.plucking === 'boolean', R.map(Boolean)],
  // [(_, queryContext) => queryContext?.plucking === 'json', R.map(uJSONParse)],
  [Array.isArray, R.map(R.when(R.is(Object), castValues))],
  // @ts-expect-error bloody ramda and types again
  [R.is(Object), castValues],
  [R.T, R.identity],
])

export { dbOutputCasting }
