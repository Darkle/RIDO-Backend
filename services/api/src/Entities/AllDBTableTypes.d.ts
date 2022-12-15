import type { Log, LogTable } from './Log'
import type { Post, PostTable } from './Post'
import type { Settings, SettingsTable } from './Settings'
import type { SubGroup, SubGroupTable } from './SubGroup'
import type { Subreddit, SubredditTable } from './Subreddit'
import type { Tag, TagTable } from './Tag'

type AllDBTableTypes = Log | Post | Settings | SubGroup | Subreddit | Tag

type AllPossibleDBResultTypes = undefined | AllDBTableTypes | readonly AllDBTableTypes[] | readonly []

/* eslint-disable functional/prefer-readonly-type */
interface Database {
  Log: LogTable
  Post: PostTable
  Settings: SettingsTable
  SubGroup: SubGroupTable
  Subreddit: SubredditTable
  Tag: TagTable
}
/* eslint-enable functional/prefer-readonly-type */

export type { AllDBTableTypes, AllPossibleDBResultTypes, Database }
