import { z } from 'zod'

interface Tag_Post {
  readonly tag: string
  readonly post_id: string
}

const Tag_PostZSchema = z.object({
  tag: z.string().min(1),
  post_id: z.string().min(1),
})

export type { Tag_Post }
export { Tag_PostZSchema }
