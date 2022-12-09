import { z } from 'zod'

interface Subreddit_Post {
  readonly subreddit: string
  readonly post_id: string
}

const Subreddit_PostZSchema = z.object({
  subreddit: z.string().min(1),
  post_id: z.string().min(1),
})

export type { Subreddit_Post }
export { Subreddit_PostZSchema }
