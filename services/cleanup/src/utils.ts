import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'

import type { AppRouter } from '@services/api/src/api'

const apiRPCClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `http://localhost:${process.env['API_SERVICE_PORT'] as string}/trpc`,
    }),
  ],
})

export { apiRPCClient }
