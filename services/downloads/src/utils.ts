import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'

import type { AppRouter } from '@services/api/src/api'

const apiRPCClient = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `http://localhost:${process.env['API_SERVICE_PORT'] as string}`,
    }),
  ],
})

export { apiRPCClient }
