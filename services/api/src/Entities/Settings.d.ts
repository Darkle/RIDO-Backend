import type { Brand } from 'ts-brand'

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

/* eslint-disable functional/prefer-readonly-type */
interface SettingsTable {
  unique_id: string
  number_media_downloads_at_once: number
  number_images_process_at_once: number
  update_all_day: Brand<number, 'SQLiteBool'>
  update_starting_hour: number
  update_ending_hour: number
  image_compression_quality: number
  archive_image_compression_quality: number
  max_image_width_for_non_archive_image: number
  has_seen_welcome_message: Brand<number, 'SQLiteBool'>
}
/* eslint-enable functional/prefer-readonly-type */

type SettingsSansId = Omit<Settings, 'unique_id'>

export type { Settings, SettingsSansId, SettingsTable }
