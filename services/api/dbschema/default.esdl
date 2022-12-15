module default {
  type Log {
    required property createdAt -> int64
    required property level -> enum<'fatal', 'error', 'warn', 'info', 'debug', 'trace'> {
       constraint one_of ('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    }
    property message -> str
    property service -> str
    property error -> str
    # Should other be json or string??
    property other -> str
    # property other -> json
  }

  type Settings {
    required property uniqueId -> str {
      constraint exclusive
    }
    required property numberMediaDownloadsAtOnce -> int32 {
      default := 2;
    }
    required property numberImagesProcessAtOnce -> int32 {
      default := 2;
    }
    required property updateAllDay -> bool {
      default := true;
    }
    required property updateStartingHour -> int32 {
      default := 1;
      constraint min_value(0)
      constraint max_value(23)
    }
    required property updateEndingHour -> int32 {
      default := 7;
      constraint min_value(0)
      constraint max_value(23)
    }
    required property imageCompressionQuality -> int32 {
      default := 80;
      constraint min_value(1)
      constraint max_value(100)
    }
    required property archiveImageCompressionQuality -> int32 {
      default := 80;
      constraint min_value(1)
      constraint max_value(100)
    }
    required property maxImageWidthForNonArchiveImage -> int32 {
      default := 1400;
      constraint min_value(1)
    }
    # Now that no users, prolly dont need this. Cause what if two users?
    # required property hasSeenWelcomeMessage -> bool
  }

  type Post {
    required property postId -> str {
      constraint exclusive
      constraint min_len_value(1)
    }
    required property subreddit -> str {
      constraint min_len_value(1)
    }
    required property title -> str
    required property postUrl -> str {
      constraint min_len_value(1)
    }
    required property score -> int64
    required property timestamp -> int64 {
      constraint min_value(1)
    }
    required property mediaUrl -> str
    property mediaHasBeenDownloaded -> bool {
      default := false;
    }
    property couldNotDownload -> bool {
      default := false;
    }
    property postMediaImagesHaveBeenProcessed -> bool {
      default := false;
    }
    property postMediaImagesProcessingError -> str
    property postThumbnailsCreated -> bool {
      default := false;
    }
    property mediaDownloadTries -> int32 {
      default := 0;
      constraint min_value(0)
    }
    property downloadedMediaCount -> int32 {
      default := 0;
      constraint min_value(0)
    }
    property downloadError -> str
    # an unordered set of strings
    multi property downloadedMedia -> str
  }

  type Tag {
    required property tag -> str {
      constraint exclusive
      constraint min_len_value(1)
    }
    property favrourited -> bool {
      default := false;
    }
  }

  type Subreddit {
    required property subreddit -> str {
      constraint exclusive
      constraint min_len_value(1)
    }
    property favrourited -> bool {
      default := false;
    }
    property lastUpdated -> int64 {
      default := 1;
      constraint min_value(1)
    }
  }

  type SubredditGroup {
    required property subGroup -> str {
      constraint exclusive
      constraint min_len_value(1)
    }
    property favrourited -> bool {
      default := false;
    }
  }
}
