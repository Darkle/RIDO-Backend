// import { z } from 'zod'

// import { DB } from '../db'
import { trpc } from '../api'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-lines-per-function
const tagRoutes = () => trpc.router({})

export { tagRoutes }
