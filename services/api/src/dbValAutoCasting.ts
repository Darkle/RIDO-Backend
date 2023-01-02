import type { DBInstanceType } from './db'

import * as R from 'ramda'
import { nullable, type Maybe } from 'pratica'
import type { DBTable } from './entities'

// eslint-disable-next-line complexity
const boolMapper = (boolOrNum: number | boolean): number | boolean => {
  if (typeof boolOrNum === 'number') return boolOrNum === 1
  return boolOrNum === true ? 1 : 0
}

const booleanFieldsToMap = {
  favourited: boolMapper,
  updateAllDay: boolMapper,
  mediaHasBeenDownloaded: boolMapper,
  couldNotDownload: boolMapper,
  postMediaImagesHaveBeenProcessed: boolMapper,
  postThumbnailsCreated: boolMapper,
}

const dbValueCasting = R.cond([
  [Array.isArray, R.map(R.when(R.is(Object), R.evolve(booleanFieldsToMap)))],
  // @ts-expect-error its too hard to type ramda
  [R.is(Object), R.evolve(booleanFieldsToMap)],
  [R.T, R.identity],
])

const returnSingleItemAsMaybe = (
  results: undefined | DBTable | readonly DBTable[]
): DBTable | readonly DBTable[] | Maybe<DBTable> =>
  Array.isArray(results) ? results : nullable(results as undefined | DBTable)

/*****
 This is a bit funky, but we are using a proxy for the db class methods to auto convert true/false input
 to 1/0 and vice versa for output as SQLITE DOESNT HAVE A GAAAHHHD DAMNN BOOLEAN TYPE ಠ╭╮ಠ.

 Here we also convert single item results to Maybe's cause why not do that here too right?.

 Alternate approach using a decorator: https://gist.github.com/Darkle/d3e2ab5292d7b08d48755acc1f458124
 The main downside of using a decorator is that you have to manually decorate each method.
 Although there is this: https://www.npmjs.com/package/decorate-all, but i couldnt get it to work.
 *****/
function autoCastValuesToFromDB(classRef: DBInstanceType): DBInstanceType {
  const handler = {
    get: (obj: DBInstanceType, prop: keyof DBInstanceType) =>
      typeof obj[prop] !== 'function'
        ? obj[prop]
        : // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          (...args: readonly unknown[]) => {
            // @ts-expect-error I think this is fine. Typescript is complaining that we're not being specific (which is true)
            const func = obj[prop](...args.map(dbValueCasting))

            // Check if its a promise
            if ('then' in func && 'catch' in func) {
              // @ts-expect-error ramda is just too hard to get the types right for, so im giving up here ¯\_(ツ)_/¯. None of this affects the db class though as this is hidden to typescript.
              return func.then(dbValueCasting).then(returnSingleItemAsMaybe)
            }

            // Really the only non-promise knex method we use is knex.destroy
            return func
          },
  }
  return new Proxy(classRef, handler)
}

export { autoCastValuesToFromDB }
