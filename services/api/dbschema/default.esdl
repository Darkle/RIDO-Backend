module default {
  type Log {
    required property createdAt -> float64 {
      readonly := true;
    };
    required property level -> str {
      readonly := true;
      constraint one_of ('fatal', 'error', 'warn', 'info', 'debug', 'trace');
    };
    property message -> str {
      readonly := true;
    };
    property service -> str {
      readonly := true;
    };
    property error -> str {
      readonly := true;
    };
    # Doing this as a string to make it easy to search with like
    property other -> str {
      readonly := true;
    };
    index on (.level);
  }

  type Settings {
    required property uniqueId -> str {
      constraint exclusive;
      readonly := true;
    };
    required property numberMediaDownloadsAtOnce -> int32 {
      default := 2;
    };
    required property numberImagesProcessAtOnce -> int32 {
      default := 2;
    };
    required property updateAllDay -> bool {
      default := true;
    };
    required property updateStartingHour -> int32 {
      default := 1;
      constraint min_value(0);
      constraint max_value(23);
    };
    required property updateEndingHour -> int32 {
      default := 7;
      constraint min_value(0);
      constraint max_value(23);
    };
    required property imageCompressionQuality -> int32 {
      default := 80;
      constraint min_value(1);
      constraint max_value(100);
    };
    required property archiveImageCompressionQuality -> int32 {
      default := 80;
      constraint min_value(1);
      constraint max_value(100);
    };
    required property maxImageWidthForNonArchiveImage -> int32 {
      default := 1400;
      constraint min_value(1);
    };
    # Now that no users, prolly dont need this. Cause what if two users?
    # required property hasSeenWelcomeMessage -> bool
  }

  # This may need to be: select Subreddit filter str_lower(.subreddit) = str_lower(Post.subredditName)
  #  https://www.edgedb.com/docs/datamodel/computeds
  #  https://www.edgedb.com/docs/datamodel/computeds#filtering
  type Post {
    multi link tags -> Tag;
    required link subreddit -> Subreddit {
      default := (
        assert_single(
          (select Subreddit filter str_lower(.subreddit) = str_lower(Post.subredditName))
        )
      );
      # TODO: check this works
      on target delete delete source
    };
    required property postId -> str {
      constraint exclusive;
      constraint min_len_value(1);
      readonly := true;
    };
    required property subredditName -> str {
      constraint min_len_value(1);
      readonly := true;
    };
    required property title -> str {
      readonly := true;
    };
    required property postUrl -> str {
      constraint min_len_value(1);
      readonly := true;
    };
    required property score -> int64 {
      readonly := true;
    };
    required property timestamp -> int64 {
      constraint min_value(1);
      readonly := true;
      annotation description := "The timestamp is taken from the post's created_utc property, which is a unix timestamp (ie the number of _SECONDS_ since the epoch). It's UTC is GMT, aka no timezone.";
    };
    required property mediaUrl -> str {
      readonly := true;
    };
    property mediaHasBeenDownloaded -> bool {
      default := false;
    };
    property couldNotDownload -> bool {
      default := false;
    };
    property postMediaImagesHaveBeenProcessed -> bool {
      default := false;
    };
    property postMediaImagesProcessingError -> str;
    property postThumbnailsCreated -> bool {
      default := false;
    };
    property mediaDownloadTries -> int32 {
      default := 0;
      constraint min_value(0);
    };
    property downloadedMediaCount -> int32 {
      default := 0;
      constraint min_value(0);
    };
    property downloadError -> str;
    property downloadedMedia -> array<str>;

    index on (.subredditName);
    index on (.timestamp);
    index on ((.timestamp, .subredditName));
  }

  type Tag {
    multi link posts -> Post;
    required property tag -> str {
      constraint exclusive;
      constraint min_len_value(1);
      readonly := true;
    };
    property favourited -> bool {
      default := false;
    };
    index on (.tag);
  }

  type Subreddit {
    multi link posts -> Post;
    multi link groups -> SubredditGroup;
    required property subreddit -> str {
      constraint exclusive;
      constraint min_len_value(1);
      readonly := true;
    };
    property favourited -> bool {
      default := false;
    };
    property lastUpdated -> int64 {
      default := 1;
      constraint min_value(1);
    };
    index on (.subreddit);
  }

  type SubredditGroup {
    multi link subreddits -> Subreddit;
    required property subGroup -> str {
      constraint exclusive;
      constraint min_len_value(1);
      readonly := true;
    };
    property favourited -> bool {
      default := false;
    };
    index on (.subGroup);
  }
}
