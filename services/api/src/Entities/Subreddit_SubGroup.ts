import { z } from 'zod'

interface Subreddit_SubGroup {
  readonly subreddit: string
  readonly sub_group: string
}

const Subreddit_SubGroupZSchema = z.object({
  subreddit: z.string().min(1),
  sub_group: z.string().min(1),
})

export type { Subreddit_SubGroup }
export { Subreddit_SubGroupZSchema }
