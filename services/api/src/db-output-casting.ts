import * as R from 'ramda'

//TODO: this is a bit out there, but there might be an sql parser where we can check which columns are boolean
function dbOutputCasting(result: unknown, queryContext: unknown) {
  console.log('result', result)
  console.log('queryContext', queryContext)
  // if (Array.isArray(result)) {
  //   return result.map(row => convertToCamel(row))
  // } else {
  //   return convertToCamel(result)
  // }
}

export { dbOutputCasting }
