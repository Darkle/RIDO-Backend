import { readFileSync } from 'node:fs'
import path from 'path'

import { nullable } from 'pratica'
import * as R from 'ramda'
import { isPromise } from '@typed/is-promise'
import sqliteParser from 'sqlite-parser'
import type { SQLFileParserReturnType } from './types'
import type { DBInstanceType } from './db'

const uJSONParse = R.unary(JSON.parse)
const uJSONStringify = R.unary(JSON.stringify)

const ridoDBSqlFileData = readFileSync(path.resolve(process.cwd(), 'init-rido-db.sql')).toString()

const ridoDBSQL = sqliteParser(ridoDBSqlFileData) as SQLFileParserReturnType

const getAllDataColmnsOfCertainType = (dbSql: SQLFileParserReturnType, type: string): readonly string[] =>
  dbSql.statement
    .flatMap(statement =>
      statement.variant !== 'create'
        ? []
        : statement?.definition?.filter(definition => definition.datatype?.variant === type)
    )
    .map(definition => definition.name)

const jsonColumnsForAllDBs = [...getAllDataColmnsOfCertainType(ridoDBSQL, 'json')].flat()

const booleanColumnsForAllDBs = [...getAllDataColmnsOfCertainType(ridoDBSQL, 'boolean')].flat()

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
From: https://github.com/Darkle/Roffline-Nodejs-Old/blob/main/server/db/db-output-value-conversions.js
When using .pluck('foo') in knex and the pluck is getting either boolean values or json values, we
use a query context to tell our postProcessResponse to convert it (since pluck just returns an array
of values with no key name, which would otherwise make it impossible to know when need to convert it).
*****/
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const dbValueCasting = (transforms: typeof outputTransformations | typeof inputTransformations) =>
  R.cond([
    // @ts-expect-error bloody ramda and types again
    [(_, queryContext): readonly boolean[] => queryContext?.plucking === 'boolean', R.map(Boolean)],
    // @ts-expect-error bloody ramda and types again
    [(_, queryContext): readonly unknown[] => queryContext?.plucking === 'json', R.map(uJSONParse)],
    // @ts-expect-error bloody ramda and types again
    [Array.isArray, R.map(R.when(R.is(Object), R.evolve(transforms)))],
    // @ts-expect-error bloody ramda and types again
    [R.is(Object), R.evolve(transforms)],
    // @ts-expect-error bloody ramda and types again
    [R.T, R.identity],
  ])

const dbInputValCasting = dbValueCasting(inputTransformations)
const dbOutputValCasting = dbValueCasting(outputTransformations)

/*****
 Alternate approach using a decorator: https://gist.github.com/Darkle/d3e2ab5292d7b08d48755acc1f458124
 The main downside of using a decorator is that you have to manually decorate each method.
 Although there is this: https://www.npmjs.com/package/decorate-all, but i couldnt get it to work.
 *****/
function autoCastValuesToFromDB(classRef: DBInstanceType): DBInstanceType {
  const handler = {
    // needs to return apply cause async func
    get: (obj: DBInstanceType, prop: keyof DBInstanceType) =>
      typeof obj[prop] !== 'function'
        ? obj[prop]
        : // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          (...args: readonly unknown[]) => {
            // @ts-expect-error I think this is fine. Typescript is complaining that we're not being specific (which is true)
            const func = obj[prop](...args.map(dbInputValCasting))
            return isPromise(func) ? func.then(dbOutputValCasting).then(nullable) : func
          },
  }
  return new Proxy(classRef, handler)
}

export { dbOutputValCasting, autoCastValuesToFromDB, dbInputValCasting }
