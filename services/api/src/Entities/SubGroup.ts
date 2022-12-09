import { z } from 'zod'

interface SubGroup {
  readonly sub_group: string
  readonly favourited: boolean
}

const SubGroupZSchema = z.object({
  sub_group: z.string().min(1),
  favourited: z.boolean(),
})

export type { SubGroup }

export { SubGroupZSchema }
