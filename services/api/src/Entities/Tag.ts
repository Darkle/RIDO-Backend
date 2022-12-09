import { z } from 'zod'

interface Tag {
  readonly tag: string
  readonly favourited: boolean
}

const TagZSchema = z.object({
  tag: z.string().min(1),
  favourited: z.boolean(),
})

export type { Tag }
export { TagZSchema }
