CREATE MIGRATION m1ybgjrxbwlbjpd6pl53vaaljm5m5flptaur77da5hgugduvjnrpgq
    ONTO initial
{
  CREATE FUTURE nonrecursive_access_policies;
  CREATE TYPE default::Feed {
      CREATE REQUIRED PROPERTY feedName -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::min_len_value(1);
      };
      CREATE REQUIRED PROPERTY feedType -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::min_len_value(1);
          CREATE CONSTRAINT std::one_of('reddit', 'tops', 'cand');
      };
      CREATE REQUIRED PROPERTY feedId := (((std::str_lower(.feedType) ++ '-') ++ std::str_lower(.feedName)));
      CREATE CONSTRAINT std::exclusive ON (.feedId);
      CREATE INDEX ON (.feedId);
      CREATE PROPERTY favourited -> std::bool {
          SET default := false;
      };
      CREATE INDEX ON (.favourited);
      CREATE REQUIRED PROPERTY feedNameLC := (std::str_lower(.feedName));
      CREATE PROPERTY lastUpdated -> std::int64 {
          SET default := 1;
          CREATE CONSTRAINT std::min_value(1);
      };
      CREATE PROPERTY updateCheck_LastPostSeen -> std::str {
          CREATE ANNOTATION std::description := 'Only used for non-reddit feeds.';
      };
  };
  CREATE TYPE default::Post {
      CREATE REQUIRED PROPERTY feedType -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::min_len_value(1);
          CREATE CONSTRAINT std::one_of('reddit', 'titops', 'cand');
      };
      CREATE REQUIRED PROPERTY postId -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::min_len_value(1);
      };
      CREATE REQUIRED PROPERTY uniqueId := (((std::str_lower(.feedType) ++ '-') ++ std::str_lower(.postId)));
      CREATE REQUIRED LINK feed -> default::Feed {
          SET default := (std::assert_single((SELECT
              default::Feed
          FILTER
              (.feedId = default::Post.uniqueId)
          )));
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE CONSTRAINT std::exclusive ON (.uniqueId);
      CREATE REQUIRED PROPERTY feedName -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::exclusive;
          CREATE CONSTRAINT std::min_len_value(1);
      };
      CREATE INDEX ON ((.feedType, .feedName));
      CREATE REQUIRED PROPERTY timestamp -> std::int64 {
          SET readonly := true;
          CREATE CONSTRAINT std::min_value(1);
          CREATE ANNOTATION std::description := "The timestamp is taken from the post's created_utc property, which is a unix timestamp (ie the number of _SECONDS_ since the epoch). It's UTC is GMT, aka no timezone.";
      };
      CREATE INDEX ON (.timestamp);
      CREATE INDEX ON ((.timestamp, .feedType, .feedName));
      CREATE PROPERTY couldNotDownload -> std::bool {
          SET default := false;
      };
      CREATE PROPERTY downloadError -> std::str;
      CREATE PROPERTY downloadedMedia -> array<std::str>;
      CREATE PROPERTY downloadedMediaCount -> std::int32 {
          SET default := 0;
          CREATE CONSTRAINT std::min_value(0);
      };
      CREATE PROPERTY mediaDownloadTries -> std::int32 {
          SET default := 0;
          CREATE CONSTRAINT std::min_value(0);
      };
      CREATE PROPERTY mediaHasBeenDownloaded -> std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY mediaUrl -> std::str {
          SET readonly := true;
      };
      CREATE PROPERTY postMediaImagesHaveBeenProcessed -> std::bool {
          SET default := false;
      };
      CREATE PROPERTY postMediaImagesProcessingError -> std::str;
      CREATE PROPERTY postThumbnailsCreated -> std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY postUrl -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::min_len_value(1);
      };
      CREATE REQUIRED PROPERTY score -> std::int64 {
          SET readonly := true;
      };
      CREATE REQUIRED PROPERTY title -> std::str {
          SET readonly := true;
      };
  };
  ALTER TYPE default::Feed {
      CREATE MULTI LINK posts -> default::Post;
  };
  CREATE TYPE default::Tag {
      CREATE MULTI LINK feeds -> default::Feed;
      CREATE MULTI LINK posts -> default::Post;
      CREATE PROPERTY favourited -> std::bool {
          SET default := false;
      };
      CREATE INDEX ON (.favourited);
      CREATE REQUIRED PROPERTY tag -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::exclusive;
          CREATE CONSTRAINT std::min_len_value(1);
      };
      CREATE INDEX ON (.tag);
  };
  ALTER TYPE default::Feed {
      CREATE MULTI LINK tags -> default::Tag;
  };
  CREATE TYPE default::Log {
      CREATE REQUIRED PROPERTY level -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::one_of('fatal', 'error', 'warn', 'info', 'debug', 'trace');
      };
      CREATE INDEX ON (.level);
      CREATE REQUIRED PROPERTY createdAt -> std::float64 {
          SET readonly := true;
      };
      CREATE PROPERTY error -> std::str {
          SET readonly := true;
      };
      CREATE PROPERTY message -> std::str {
          SET readonly := true;
      };
      CREATE PROPERTY other -> std::json {
          SET default := (std::to_json('{}'));
          SET readonly := true;
      };
      CREATE PROPERTY otherAsStr := (std::to_str(.other));
      CREATE PROPERTY service -> std::str {
          SET readonly := true;
      };
  };
  ALTER TYPE default::Post {
      CREATE MULTI LINK tags -> default::Tag;
  };
  CREATE TYPE default::Settings {
      CREATE REQUIRED PROPERTY archiveImageCompressionQuality -> std::int32 {
          SET default := 80;
          CREATE CONSTRAINT std::max_value(100);
          CREATE CONSTRAINT std::min_value(1);
      };
      CREATE REQUIRED PROPERTY imageCompressionQuality -> std::int32 {
          SET default := 80;
          CREATE CONSTRAINT std::max_value(100);
          CREATE CONSTRAINT std::min_value(1);
      };
      CREATE REQUIRED PROPERTY maxImageWidthForNonArchiveImage -> std::int32 {
          SET default := 1400;
          CREATE CONSTRAINT std::min_value(1);
      };
      CREATE REQUIRED PROPERTY numberImagesProcessAtOnce -> std::int32 {
          SET default := 2;
      };
      CREATE REQUIRED PROPERTY numberMediaDownloadsAtOnce -> std::int32 {
          SET default := 2;
      };
      CREATE REQUIRED PROPERTY uniqueId -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY updateAllDay -> std::bool {
          SET default := true;
      };
      CREATE REQUIRED PROPERTY updateEndingHour -> std::int32 {
          SET default := 7;
          CREATE CONSTRAINT std::max_value(23);
          CREATE CONSTRAINT std::min_value(0);
      };
      CREATE REQUIRED PROPERTY updateStartingHour -> std::int32 {
          SET default := 1;
          CREATE CONSTRAINT std::max_value(23);
          CREATE CONSTRAINT std::min_value(0);
      };
  };
};
