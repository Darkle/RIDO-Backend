PRAGMA foreign_keys = ON;

PRAGMA journal_mode = WAL;

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
  other JSON NULL,
  otherAsStr TEXT NULL
);

-- There isnt really a BOOLEAN type, but I'm labelling booleans as such just for better labelling. Sqlite doesnt mind (as long as not in strict mode)
CREATE TABLE IF NOT EXISTS Settings(
  uniqueId TEXT NOT NULL,
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
  maxImageWidthDorNonArchiveImage INTEGER CHECK(maxImageWidthDorNonArchiveImage > 0) DEFAULT 1400,
  UNIQUE(uniqueId)
);

-- Set up default settings
INSERT
  OR IGNORE INTO Settings(uniqueId)
VALUES
  ("settings");

CREATE TABLE IF NOT EXISTS Post(
  -- Check uniqueId contains a dash character
  uniqueId TEXT PRIMARY KEY CHECK(length(postId) > 0) CHECK(feedDomain LIKE '%-%') NOT NULL,
  postId TEXT CHECK(length(postId) > 0) NOT NULL,
  feed TEXT NOT NULL,
  tags JSON NULL,
  -- Check feedDomain contains a dot character
  feedDomain TEXT COLLATE NOCASE CHECK(length(feedDomain) > 0) CHECK(feedDomain LIKE '%.%') NOT NULL,
  feedId TEXT CHECK(length(feedDomain) > 0) CHECK(feedDomain LIKE '%.%') NOT NULL,
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
  postThumbnailsCreated BOOLEAN CHECK(
    postThumbnailsCreated = 0
    OR postThumbnailsCreated = 1
  ) DEFAULT 0,
  postMediaImagesProcessingError TEXT NULL,
  downloadError TEXT NULL,
  mediaDownloadTries INTEGER CHECK(mediaDownloadTries > -1) DEFAULT 0,
  downloadedMediaCount INTEGER CHECK(downloadedMediaCount > -1) DEFAULT 0,
  downloadedMedia JSON NULL
);

CREATE TABLE IF NOT EXISTS Feed(
  -- Check uniqueId contains a dash character
  uniqueId TEXT PRIMARY KEY CHECK(length(uniqueId) > 0) CHECK(feedDomain LIKE '%-%') NOT NULL,
  feedDomain TEXT COLLATE NOCASE CHECK(length(feedDomain) > 0) NOT NULL,
  feedId TEXT CHECK(length(feedId) > 0) NOT NULL,
  favourited BOOLEAN CHECK(
    favourited = 0
    OR favourited = 1
  ) DEFAULT 0,
  lastUpdated INTEGER CHECK(lastUpdated > 0) DEFAULT 1,
  updateCheck_LastPostSeen TEXT NULL,
  posts JSON NULL,
  tags JSON NULL
);

CREATE TABLE IF NOT EXISTS Tag(
  tag TEXT PRIMARY KEY CHECK(length(tag) > 0) NOT NULL,
  favourited BOOLEAN CHECK(
    favourited = 0
    OR favourited = 1
  ) DEFAULT 0,
  feeds JSON NULL,
  posts JSON NULL
);