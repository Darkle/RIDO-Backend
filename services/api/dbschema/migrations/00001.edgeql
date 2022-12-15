CREATE MIGRATION m1bghcrgtux6wv3sgqli4nbqt7lqchubslbuyaz4ctehhmso3kx2mq
    ONTO initial
{
  CREATE FUTURE nonrecursive_access_policies;
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
          SET readonly := true;
      };
      CREATE PROPERTY service -> std::str {
          SET readonly := true;
      };
  };
  CREATE TYPE default::Post {
      CREATE REQUIRED PROPERTY timestamp -> std::int64 {
          SET readonly := true;
          CREATE CONSTRAINT std::min_value(1);
      };
      CREATE INDEX ON (.timestamp);
      CREATE REQUIRED PROPERTY subredditName -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::min_len_value(1);
      };
      CREATE INDEX ON (.subredditName);
      CREATE INDEX ON ((.timestamp, .subredditName));
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
      CREATE REQUIRED PROPERTY postId -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::exclusive;
          CREATE CONSTRAINT std::min_len_value(1);
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
  CREATE TYPE default::Subreddit {
      CREATE REQUIRED PROPERTY subreddit -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::exclusive;
          CREATE CONSTRAINT std::min_len_value(1);
      };
      CREATE REQUIRED MULTI LINK posts -> default::Post;
      CREATE INDEX ON (.subreddit);
      CREATE PROPERTY favrourited -> std::bool {
          SET default := false;
      };
      CREATE PROPERTY lastUpdated -> std::int64 {
          SET default := 1;
          CREATE CONSTRAINT std::min_value(1);
      };
  };
  ALTER TYPE default::Post {
      CREATE REQUIRED LINK subreddit -> default::Subreddit {
          SET default := (std::assert_single((SELECT
              default::Subreddit
          FILTER
              (std::str_lower(.subreddit) = std::str_lower(default::Post.subredditName))
          )));
          ON TARGET DELETE DELETE SOURCE;
      };
  };
  CREATE TYPE default::Tag {
      CREATE MULTI LINK posts -> default::Post;
      CREATE REQUIRED PROPERTY tag -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::exclusive;
          CREATE CONSTRAINT std::min_len_value(1);
      };
      CREATE INDEX ON (.tag);
      CREATE PROPERTY favrourited -> std::bool {
          SET default := false;
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
  CREATE TYPE default::SubredditGroup {
      CREATE MULTI LINK subreddits -> default::Subreddit;
      CREATE REQUIRED PROPERTY subGroup -> std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::exclusive;
          CREATE CONSTRAINT std::min_len_value(1);
      };
      CREATE INDEX ON (.subGroup);
      CREATE PROPERTY favrourited -> std::bool {
          SET default := false;
      };
  };
  ALTER TYPE default::Subreddit {
      CREATE MULTI LINK groups -> default::SubredditGroup;
  };
};
