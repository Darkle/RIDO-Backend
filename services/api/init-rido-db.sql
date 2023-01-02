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
  post_url TEXT CHECK(length(post_url) > 0) NOT NULL,
  score TEXT NOT NULL,
  timestamp INTEGER CHECK(timestamp > 0) NOT NULL,
  media_url TEXT NOT NULL,
  mediaHas_beenDownloaded BOOLEAN CHECK(
    mediaHas_beenDownloaded = 0
    OR mediaHas_beenDownloaded = 1
  ) DEFAULT 0,
  could_notDownload BOOLEAN CHECK(
    could_notDownload = 0
    OR could_notDownload = 1
  ) DEFAULT 0,
  postMediaImagesHave_beenProcessed BOOLEAN CHECK(
    postMediaImagesHave_beenProcessed = 0
    OR postMediaImagesHave_beenProcessed = 1
  ) DEFAULT 0,
  post_thumbnailsCreated BOOLEAN CHECK(
    post_thumbnailsCreated = 0
    OR post_thumbnailsCreated = 1
  ) DEFAULT 0,
  postMediaImagesProcessingError TEXT NULL,
  downloadError TEXT NULL,
  mediaDownload_tries INTEGER CHECK(mediaDownload_tries > -1) DEFAULT 0,
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
  last_updated INTEGER CHECK(last_updated > 0) DEFAULT 1,
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