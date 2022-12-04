CREATE TABLE IF NOT EXISTS Settings(
  uniqueId TEXT NOT NULL,
  numberMediaDownloadsAtOnce INTEGER CHECK(numberMediaDownloadsAtOnce > 0) NOT NULL DEFAULT 2,
  numberImagesProcessAtOnce INTEGER CHECK(numberImagesProcessAtOnce > 0) NOT NULL DEFAULT 2,
  updateAllDay INTEGER CHECK(
    updateAllDay = 0
    OR updateAllDay = 1
  ) NOT NULL DEFAULT 1,
  -- between check is inclusive
  updateStartingHour INTEGER CHECK(
    updateStartingHour BETWEEN 0
    AND 23
  ) NOT NULL DEFAULT 1,
  updateEndingHour INTEGER CHECK(
    updateEndingHour BETWEEN 0
    AND 23
  ) NOT NULL DEFAULT 7,
  imageCompressionQuality INTEGER CHECK(
    imageCompressionQuality BETWEEN 1
    AND 100
  ) NOT NULL DEFAULT 80,
  archiveImageCompressionQuality INTEGER CHECK(
    archiveImageCompressionQuality BETWEEN 1
    AND 100
  ) NOT NULL DEFAULT 80,
  maxImageWidthForNonArchiveImage INTEGER CHECK(maxImageWidthForNonArchiveImage > 0) NOT NULL DEFAULT 1400,
  hasSeenWelcomeMessage INTEGER CHECK(
    updateAllDay = 0
    OR updateAllDay = 1
  ) NOT NULL DEFAULT 0,
  UNIQUE(uniqueId)
);

-- Set up default admin settings
INSERT
  OR IGNORE INTO Settings(uniqueId)
VALUES
  ("admin-settings");

CREATE TABLE IF NOT EXISTS Tag(
  tag TEXT COLLATE NOCASE PRIMARY KEY CHECK(length(tag) > 0) NOT NULL,
  favourited INTEGER CHECK(
    favourited = 0
    OR favourited = 1
  ) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Post(
  postId TEXT PRIMARY KEY CHECK(length(postId) > 0) NOT NULL,
  subreddit TEXT COLLATE NOCASE CHECK(length(subreddit) > 0) NOT NULL,
  title TEXT NOT NULL,
  postUrl TEXT CHECK(length(postUrl) > 0) NOT NULL,
  score TEXT CHECK(typeof(score) = 'integer') NOT NULL,
  timestamp INTEGER CHECK(timestamp > 0) NOT NULL,
  mediaUrl TEXT NOT NULL,
  mediaHasBeenDownloaded INTEGER CHECK(
    mediaHasBeenDownloaded = 0
    OR mediaHasBeenDownloaded = 1
  ) NOT NULL DEFAULT 0,
  couldNotDownload INTEGER CHECK(
    couldNotDownload = 0
    OR couldNotDownload = 1
  ) NOT NULL DEFAULT 0,
  postMediaImagesHaveBeenProcessed INTEGER CHECK(
    postMediaImagesHaveBeenProcessed = 0
    OR postMediaImagesHaveBeenProcessed = 1
  ) NOT NULL DEFAULT 0,
  postMediaImagesProcessingError TEXT NULL,
  postThumbnailsCreated INTEGER CHECK(
    postThumbnailsCreated = 0
    OR postThumbnailsCreated = 1
  ) NOT NULL DEFAULT 0,
  mediaDownloadTries INTEGER CHECK(mediaDownloadTries > 0) NOT NULL DEFAULT 0,
  downloadedMediaCount INTEGER CHECK(downloadedMediaCount > 0) NOT NULL DEFAULT 0,
  downloadError TEXT NULL,
  downloadedMedia TEXT NULL,
  -- https://sqlite.org/foreignkeys.html
  FOREIGN KEY(subreddit) REFERENCES Subreddit(subreddit) ON DELETE CASCADE
);

-- Binding table
CREATE TABLE IF NOT EXISTS Tag_Post(
  tag TEXT COLLATE NOCASE CHECK(length(tag) > 0) NOT NULL,
  postId TEXT CHECK(length(postId) > 0) NOT NULL,
  FOREIGN KEY(tag) REFERENCES Tag(tag) ON DELETE CASCADE,
  FOREIGN KEY(postId) REFERENCES Post(postId)
);

-- Binding table
CREATE TABLE IF NOT EXISTS Subreddit_Post(
  subreddit TEXT COLLATE NOCASE CHECK(length(subreddit) > 0) NOT NULL,
  postId TEXT CHECK(length(postId) > 0) NOT NULL,
  FOREIGN KEY(subreddit) REFERENCES Subreddit(subreddit) ON DELETE CASCADE,
  FOREIGN KEY(postId) REFERENCES Post(postId)
);

CREATE TABLE IF NOT EXISTS Subreddit(
  -- case insensitive so user cant accidentally create same subreddit twice with different casing
  subreddit TEXT COLLATE NOCASE PRIMARY KEY CHECK(length(subreddit) > 0) NOT NULL,
  favourited INTEGER CHECK(
    favourited = 0
    OR favourited = 1
  ) NOT NULL DEFAULT 0,
  lastUpdated INTEGER CHECK(lastUpdated > 0) NOT NULL
);

CREATE TABLE IF NOT EXISTS SubredditGroup(
  sub_group TEXT COLLATE NOCASE PRIMARY KEY CHECK(length(sub_group) > 0) NOT NULL,
  favourited INTEGER CHECK(
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