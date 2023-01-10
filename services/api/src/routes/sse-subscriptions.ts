import { PassThrough } from 'stream'
import type { Settings } from '@prisma/client'
import Koa from 'koa'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { EE } from '../events'

const subscriptionsServer = new Koa()

const createSSEEvent = (event: string, data: Settings): string =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

// https://medium.com/trabe/server-sent-events-sse-streams-with-node-and-koa-d9330677f0bf
// eslint-disable-next-line max-lines-per-function
subscriptionsServer.use(ctx => {
  ctx.request.socket.setTimeout(0)
  ctx.req.socket.setNoDelay(true)
  ctx.req.socket.setKeepAlive(true)

  ctx.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'x-no-compression': 'true',
    Connection: 'keep-alive',
  })

  const stream = new PassThrough()

  // eslint-disable-next-line functional/immutable-data
  ctx.status = HttpStatusCode.OK
  // eslint-disable-next-line functional/immutable-data
  ctx.body = stream

  const settingsUpdate = (data: Settings): void => {
    stream.write(createSSEEvent('settings-update', data))
  }

  EE.on('settingsUpdate', settingsUpdate)

  stream.on('close', () => {
    EE.removeListener('settingsUpdate', settingsUpdate)
  })
})

const apiSubscriptionsServicePort = Number(process.env['API_SERVICE_SUBSCRIPTIONS_PORT'])

const startSubscriptionsServer = (): Promise<void> =>
  new Promise((resolve, reject) => {
    subscriptionsServer.on('error', reject)

    subscriptionsServer.listen(apiSubscriptionsServicePort, () => {
      console.info(`API _subscription_ service listening on port ${apiSubscriptionsServicePort}`)
      resolve()
    })
  })

export { startSubscriptionsServer }
