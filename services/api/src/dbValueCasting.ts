import { readFileSync } from 'node:fs'
import path from 'path'

import * as R from 'ramda'

import sqliteParser from 'sqlite-parser'
import type { SQLFileParserReturnType } from './types'

const uJSONParse = R.unary(JSON.parse)
const uJSONStringify = R.unary(JSON.stringify)

/*****
now that i think about it, it might be alright to auto json.parse here cause when will i be getting thousands of posts at once? That wont happen on the front-end, and even when i do need to do that for the services, I will not be getting the json data columns for that (eg getting all posts that need to be downloaded)
*****/

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
  When using .pluck('foo') in knex and the pluck is getting either boolean values or json values, we use a query context
   to tell our postProcessResponse to convert it (since pluck just returns an array of values with no key name, which would otherwise make it impossible to know when to convert it).
*****/
// [(_, queryContext) => queryContext?.plucking === 'boolean', R.map(Boolean)],
// [(_, queryContext) => queryContext?.plucking === 'json', R.map(uJSONParse)],

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const dbValueCasting = (transforms: typeof outputTransformations | typeof inputTransformations) =>
  R.cond([
    [Array.isArray, R.map(R.when(R.is(Object), R.evolve(transforms)))],
    // @ts-expect-error bloody ramda and types again
    [R.is(Object), R.evolve(transforms)],
    [R.T, R.identity],
  ])

const dbOutputValCasting = dbValueCasting(outputTransformations)
const dbInputValCasting = dbValueCasting(inputTransformations)

/* eslint-disable @typescript-eslint/ban-types,@typescript-eslint/no-unsafe-assignment,functional/immutable-data,@typescript-eslint/explicit-function-return-type,no-param-reassign,@typescript-eslint/no-explicit-any,functional/prefer-readonly-type,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/ban-ts-comment */
// https://stackoverflow.com/a/52106109/2785644
const castValuesForDB = (): MethodDecorator => {
  return (_target: Object, _propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      return originalMethod.apply(this, args.map(dbInputValCasting))
    }

    return descriptor
  }
}
/* eslint-enable @typescript-eslint/ban-types,@typescript-eslint/no-unsafe-assignment,functional/immutable-data,@typescript-eslint/explicit-function-return-type,no-param-reassign,@typescript-eslint/no-explicit-any,functional/prefer-readonly-type,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/ban-ts-comment */

export { dbOutputValCasting, castValuesForDB }
