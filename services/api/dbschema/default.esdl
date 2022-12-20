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
    property other -> json {
      readonly := true;
      default := to_json('{}');
    };
    property otherAsStr := to_str(.other);
    
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
  }

  type Post {
    multi link tags -> Tag;
    required link feed -> Feed {
      default := (
        assert_single(
          (select Feed filter .feedId = Post.uniqueId)
        )
      );
      # TODO: check this works
      on target delete delete source
    };
    required property postId -> str {
      constraint min_len_value(1);
      readonly := true;
    };
    required property feedType -> str {
      constraint min_len_value(1);
      readonly := true;
      constraint one_of ('reddit', 'titops', 'cand');
    };
    required property feedName -> str {
      constraint exclusive;
      constraint min_len_value(1);
      readonly := true;
    };
    # Not an out and out computed property as we want to be able to filter by this
    required property uniqueId -> str {
      default := str_lower(.feedType ++ '-' ++ .postId);
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

    constraint exclusive on (.uniqueId);

    index on (.timestamp);
    index on ((.feedType, .feedName));
    index on ((.timestamp, .feedType, .feedName));
  }

  type Feed {
    multi link posts -> Post;
    multi link tags -> Tag;
    # Not an out and out computed property as we want to be able to filter by this
    required property feedId -> str {
      default := str_lower(Feed.feedType) ++ '-' ++ str_lower(Feed.feedName);
      readonly := true;
    };
    required property feedType -> str {
      constraint min_len_value(1);
      readonly := true;
      constraint one_of ('reddit', 'tops', 'cand');
    };
    required property feedNameLC := str_lower(.feedName);
    required property feedName -> str {
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
    property updateCheck_LastPostSeen -> str {
      annotation description := "Only used for non-reddit feeds.";
    };

    constraint exclusive on (.feedId);

    index on (.favourited);
    index on (.feedId);
  }

  type Tag {
    multi link posts -> Post;
    multi link feeds -> Feed;
    required property tag -> str {
      constraint exclusive;
      constraint min_len_value(1);
      readonly := true;
    };
    property favourited -> bool {
      default := false;
    };
    index on (.tag);
    index on (.favourited);
  }


}
