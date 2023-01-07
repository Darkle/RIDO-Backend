CREATE TABLE IF NOT EXISTS Log(
  createdAt INTEGER NOT NULL,
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
  other TEXT NULL
);

CREATE TABLE IF NOT EXISTS Settings(
  uniqueId PRIMARY KEY TEXT NOT NULL,
  numberMediaDownloadsAtOnce INTEGER CHECK(numberMediaDownloadsAtOnce > 0) DEFAULT 2,
  numberImagesProcessAtOnce INTEGER CHECK(numberImagesProcessAtOnce > 0) DEFAULT 2,
  updateAllDay BOOLEAN CHECK(
    updateAllDay = 0
    OR updateAllDay = 1
  ) DEFAULT 1,
  -- between check is inclusive
  updateStartingHour INTEGER CHECK(
    updateStartingHour BETWEEN 0
    AND 23
  ) DEFAULT 1,
  updateEndingHour INTEGER CHECK(
    updateEndingHour BETWEEN 0
    AND 23
  ) DEFAULT 7,
  imageCompressionQuality INTEGER CHECK(
    imageCompressionQuality BETWEEN 1
    AND 100
  ) DEFAULT 80,
  archiveImageCompressionQuality INTEGER CHECK(
    archiveImageCompressionQuality BETWEEN 1
    AND 100
  ) DEFAULT 80,
  maxImageWidthForNonArchiveImage INTEGER CHECK(maxImageWidthForNonArchiveImage > 0) DEFAULT 1400,
  UNIQUE(uniqueId)
);

-- Set up default settings
INSERT
  OR IGNORE INTO Settings(uniqueId)
VALUES
  ("settings");

CREATE TABLE IF NOT EXISTS Post(
  uniqueId INTEGER PRIMARY KEY NOT NULL,
  postId TEXT CHECK(length(postId) > 0) NOT NULL,
  title TEXT NOT NULL,
  postUrl TEXT CHECK(length(postUrl) > 0) NOT NULL,
  score TEXT NOT NULL,
  timestamp INTEGER CHECK(timestamp > 0) NOT NULL,
  mediaUrl TEXT NOT NULL,
  mediaHasBeenDownloaded BOOLEAN CHECK(
    mediaHasBeenDownloaded = 0
    OR mediaHasBeenDownloaded = 1
  ) DEFAULT 0,
  couldNotDownload BOOLEAN CHECK(
    couldNotDownload = 0
    OR couldNotDownload = 1
  ) DEFAULT 0,
  postMediaImagesHaveBeenProcessed BOOLEAN CHECK(
    postMediaImagesHaveBeenProcessed = 0
    OR postMediaImagesHaveBeenProcessed = 1
  ) DEFAULT 0,
  postMediaImagesProcessingError TEXT NULL,
  postThumbnailsCreated BOOLEAN CHECK(
    postThumbnailsCreated = 0
    OR postThumbnailsCreated = 1
  ) DEFAULT 0,
  mediaDownloadTries INTEGER CHECK(mediaDownloadTries > -1) DEFAULT 0,
  downloadedMediaCount INTEGER CHECK(downloadedMediaCount > -1) DEFAULT 0,
  downloadError TEXT NULL,
  downloadedMedia JSON NULL,
  -- https://sqlite.org/foreignkeys.html
  FOREIGN KEY(subreddit) REFERENCES Subreddit(subreddit) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Subreddit(
  -- case insensitive so user cant accidentally create same subreddit twice with different casing
  subreddit TEXT COLLATE NOCASE PRIMARY KEY CHECK(length(subreddit) > 0) NOT NULL,
  favourited BOOLEAN CHECK(
    favourited = 0
    OR favourited = 1
  ) DEFAULT 0,
  lastUpdated INTEGER CHECK(lastUpdated > 0) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Tag(
  tag TEXT COLLATE NOCASE PRIMARY KEY CHECK(length(tag) > 0) NOT NULL,
  favourited BOOLEAN CHECK(
    favourited = 0
    OR favourited = 1
  ) DEFAULT 0
);