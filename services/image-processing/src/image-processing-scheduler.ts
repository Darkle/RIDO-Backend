import { apiRPCClient } from './utils'
import { Logger } from './logger'

apiRPCClient.healthcheck
  .query()
  .then(res => {
    console.log(`res from healthcheck:`, res)
  })
  .then(() => {
    Logger.error(
      'this is an error from the image-processing service',
      new Error('this is an error from the image-processing service'),
      { meta: { thing: 3 } }
    )
  })
  .catch(err => {
    console.error(err)
  })
