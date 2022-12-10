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

type SettingsSansId = Omit<Settings, 'unique_id'>

export type { Settings, SettingsSansId }
