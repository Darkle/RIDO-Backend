import type { Log, LogTable } from './Log'
import type { Post, PostTable } from './Post'
import type { Settings, SettingsTable } from './Settings'
import type { SubGroup, SubGroupTable } from './SubGroup'
import type { Subreddit, SubredditTable } from './Subreddit'
import type { Subreddit_Post, Subreddit_PostTable } from './Subreddit_Post'
import type { Subreddit_SubGroup, Subreddit_SubGroupTable } from './Subreddit_SubGroup'
import type { Tag, TagTable } from './Tag'
import type { Tag_Post, Tag_PostTable } from './Tag_Post'

type AllDBTableTypes =
  | Log
  | Post
  | Settings
  | SubGroup
  | Subreddit
  | Tag
  // Binding tables
  | Tag_Post
  | Subreddit_Post
  | Subreddit_SubGroup

type AllPossibleDBResultTypes = undefined | AllDBTableTypes | readonly AllDBTableTypes[] | readonly []

/* eslint-disable functional/prefer-readonly-type */
interface Database {
  Log: LogTable
  Post: PostTable
  Settings: SettingsTable
  SubGroup: SubGroupTable
  Subreddit: SubredditTable
  Tag: TagTable
  Tag_Post: Tag_PostTable
  Subreddit_Post: Subreddit_PostTable
  Subreddit_SubGroup: Subreddit_SubGroupTable
}
/* eslint-enable functional/prefer-readonly-type */

export type { AllDBTableTypes, AllPossibleDBResultTypes, Database }
