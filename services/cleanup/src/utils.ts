import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import EventSource from 'eventsource'

import type { AppRouter } from '@services/api/src/api'

const apiRPCClient = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `http://localhost:${process.env['API_SERVICE_PORT'] as string}`,
    }),
  ],
})

const apiSubscriptions = new EventSource(
  `http://localhost:${process.env['API_SERVICE_SUBSCRIPTIONS_PORT'] as string}`
)

apiSubscriptions.addEventListener('error', err => console.error(err))

export { apiRPCClient, apiSubscriptions }
