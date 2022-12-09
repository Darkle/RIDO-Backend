import { z } from 'zod'

interface Settings {
  readonly unique_id: string
  readonly number_media_downloads_at_once: number
  readonly number_images_process_at_once: number
  readonly update_all_day: boolean
  readonly update_starting_hour: number
  readonly update_ending_hour: number
  readonly image_compression_quality: number
  readonly archive_image_compression_quality: number
  readonly max_image_width_for_non_archive_image: number
  readonly has_seen_welcome_message: boolean
}

/* eslint-disable @typescript-eslint/no-magic-numbers */

const SettingsZSchema = z.object({
  unique_id: z.literal('admin-settings').optional(),
  number_media_downloads_at_once: z.number().positive(),
  number_images_process_at_once: z.number().positive(),
  update_all_day: z.boolean(),
  update_starting_hour: z.number(),
  update_ending_hour: z.number(),
  image_compression_quality: z.number().min(1).max(100),
  archive_image_compression_quality: z.number().min(1).max(100),
  max_image_width_for_non_archive_image: z.number().positive(),
  has_seen_welcome_message: z.boolean(),
})

/* eslint-enable @typescript-eslint/no-magic-numbers */

export type { Settings }
export { SettingsZSchema }
