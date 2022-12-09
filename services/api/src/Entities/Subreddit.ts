import { z } from 'zod'

interface Subreddit {
  readonly subreddit: string
  readonly favourited: boolean
  readonly last_updated: number
}

const SubredditZSchema = z.object({
  subreddit: z.string().min(1),
  favourited: z.boolean(),
  last_updated: z.number().gt(-1),
})

export type { Subreddit }
export { SubredditZSchema }
