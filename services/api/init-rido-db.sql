-- The column names need to be snake case as the sqlite-parse lib we use ignores casing for column names which makes it impossible to do the auto casting if using camel case.
-- Dont want log table to be
-- Also note that BOOLEAN isnt technically a valid type for sqlite as it stores bools as int 1 or 0. However, as long as you dont use the new STRICT table feature (https://sqlite.org/stricttables.html), sqlite wont complain. We need to specify BOOLEAN as we use that in the db values auto casting code to auto cast 1\0 to true\false.
CREATE TABLE IF NOT EXISTS Log(
  created_at INTEGER NOT NULL,
  level TEXT COLLATE NOCASE CHECK(
    level IN (
      'fatal',
      'error',
      'warn',
      'info',
      'debug',
      'trace'
    )
  ) NOT NULL,
  message TEXT NULL,
  service TEXT NULL,
  error TEXT NULL,
  misc_data JSON NULL
);

CREATE TABLE IF NOT EXISTS Settings(
  unique_id TEXT NOT NULL,
  number_media_downloads_at_once INTEGER CHECK(number_media_downloads_at_once > 0) DEFAULT 2,
  number_images_process_at_once INTEGER CHECK(number_images_process_at_once > 0) DEFAULT 2,
  update_all_day BOOLEAN CHECK(
    update_all_day = 0
    OR update_all_day = 1
  ) DEFAULT 1,
  -- between check is inclusive
  update_starting_hour INTEGER CHECK(
    update_starting_hour BETWEEN 0
    AND 23
  ) DEFAULT 1,
  update_ending_hour INTEGER CHECK(
    update_ending_hour BETWEEN 0
    AND 23
  ) DEFAULT 7,
  image_compression_quality INTEGER CHECK(
    image_compression_quality BETWEEN 1
    AND 100
  ) DEFAULT 80,
  archive_image_compression_quality INTEGER CHECK(
    archive_image_compression_quality BETWEEN 1
    AND 100
  ) DEFAULT 80,
  max_image_width_for_non_archive_image INTEGER CHECK(max_image_width_for_non_archive_image > 0) DEFAULT 1400,
  has_seen_welcome_message BOOLEAN CHECK(
    has_seen_welcome_message = 0
    OR has_seen_welcome_message = 1
  ) DEFAULT 0,
  UNIQUE(unique_id)
);

-- Set up default settings
INSERT
  OR IGNORE INTO Settings(unique_id)
VALUES
  ("settings");

CREATE TABLE IF NOT EXISTS Tag(
  tag TEXT COLLATE NOCASE PRIMARY KEY CHECK(length(tag) > 0) NOT NULL,
  favourited BOOLEAN CHECK(
    favourited = 0
    OR favourited = 1
  ) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Post(
  post_id TEXT PRIMARY KEY CHECK(length(post_id) > 0) NOT NULL,
  subreddit TEXT COLLATE NOCASE CHECK(length(subreddit) > 0) NOT NULL,
  title TEXT NOT NULL,
  post_url TEXT CHECK(length(post_url) > 0) NOT NULL,
  score TEXT NOT NULL,
  timestamp INTEGER CHECK(timestamp > 0) NOT NULL,
  media_url TEXT NOT NULL,
  media_has_been_downloaded BOOLEAN CHECK(
    media_has_been_downloaded = 0
    OR media_has_been_downloaded = 1
  ) DEFAULT 0,
  could_not_download BOOLEAN CHECK(
    could_not_download = 0
    OR could_not_download = 1
  ) DEFAULT 0,
  post_media_images_have_been_processed BOOLEAN CHECK(
    post_media_images_have_been_processed = 0
    OR post_media_images_have_been_processed = 1
  ) DEFAULT 0,
  post_media_images_processing_eError TEXT NULL,
  post_thumbnails_created BOOLEAN CHECK(
    post_thumbnails_created = 0
    OR post_thumbnails_created = 1
  ) DEFAULT 0,
  media_download_tries INTEGER CHECK(media_download_tries > -1) DEFAULT 0,
  downloaded_media_count INTEGER CHECK(downloaded_media_count > -1) DEFAULT 0,
  download_error TEXT NULL,
  downloaded_media JSON NULL,
  -- https://sqlite.org/foreignkeys.html
  FOREIGN KEY(subreddit) REFERENCES Subreddit(subreddit) ON DELETE CASCADE
);

-- Binding table
CREATE TABLE IF NOT EXISTS Tag_Post(
  tag TEXT COLLATE NOCASE CHECK(length(tag) > 0) NOT NULL,
  post_id TEXT CHECK(length(post_id) > 0) NOT NULL,
  FOREIGN KEY(tag) REFERENCES Tag(tag) ON DELETE CASCADE,
  FOREIGN KEY(post_id) REFERENCES Post(post_id)
);

-- Binding table
CREATE TABLE IF NOT EXISTS Subreddit_Post(
  subreddit TEXT COLLATE NOCASE CHECK(length(subreddit) > 0) NOT NULL,
  post_id TEXT CHECK(length(post_id) > 0) NOT NULL,
  FOREIGN KEY(subreddit) REFERENCES Subreddit(subreddit) ON DELETE CASCADE,
  FOREIGN KEY(post_id) REFERENCES Post(post_id)
);

CREATE TABLE IF NOT EXISTS Subreddit(
  -- case insensitive so user cant accidentally create same subreddit twice with different casing
  subreddit TEXT COLLATE NOCASE PRIMARY KEY CHECK(length(subreddit) > 0) NOT NULL,
  favourited BOOLEAN CHECK(
    favourited = 0
    OR favourited = 1
  ) DEFAULT 0,
  last_updated INTEGER CHECK(last_updated > 0) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS SubredditGroup(
  sub_group TEXT COLLATE NOCASE PRIMARY KEY CHECK(length(sub_group) > 0) NOT NULL,
  favourited BOOLEAN CHECK(
    favourited = 0
    OR favourited = 1
  ) NOT NULL DEFAULT 0
);

-- Binding table
CREATE TABLE IF NOT EXISTS Subreddit_SubGroup(
  subreddit TEXT COLLATE NOCASE CHECK(length(subreddit) > 0) NOT NULL,
  sub_group TEXT COLLATE NOCASE CHECK(length(sub_group) > 0) NOT NULL,
  FOREIGN KEY(subreddit) REFERENCES Subreddit(subreddit),
  FOREIGN KEY(sub_group) REFERENCES SubredditGroup(sub_group) ON DELETE CASCADE
);