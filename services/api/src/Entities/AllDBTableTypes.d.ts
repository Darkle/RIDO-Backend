import type { Log } from './Log'
import type { Post } from './Post'
import type { Settings } from './Settings'
import type { SubGroup } from './SubGroup'
import type { Subreddit } from './Subreddit'
import type { Subreddit_Post } from './Subreddit_Post'
import type { Subreddit_SubGroup } from './Subreddit_SubGroup'
import type { Tag } from './Tag'
import type { Tag_Post } from './Tag_Post'

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

export type { AllDBTableTypes, AllPossibleDBResultTypes }
