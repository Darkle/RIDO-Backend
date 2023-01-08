-- CreateTable
CREATE TABLE "Settings" (
    "uniqueId" TEXT NOT NULL PRIMARY KEY DEFAULT 'settings',
    "numberMediaDownloadsAtOnce" INTEGER NOT NULL DEFAULT 2,
    "numberImagesProcessAtOnce" INTEGER NOT NULL DEFAULT 2,
    "updateAllDay" BOOLEAN NOT NULL DEFAULT true,
    "updateStartingHour" INTEGER NOT NULL DEFAULT 1,
    "updateEndingHour" INTEGER NOT NULL DEFAULT 7,
    "imageCompressionQuality" INTEGER NOT NULL DEFAULT 80,
    "archiveImageCompressionQuality" INTEGER NOT NULL DEFAULT 80,
    "maxImageWidthForNonArchiveImage" INTEGER NOT NULL DEFAULT 1400
);

-- CreateTable
CREATE TABLE "Logs" (
    "uniqueId" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    "level" TEXT NOT NULL,
    "message" TEXT,
    "service" TEXT,
    "error" TEXT,
    "other" TEXT
);

-- CreateTable
CREATE TABLE "Posts" (
    "uniqueId" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "postUrl" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaHasBeenDownloaded" BOOLEAN NOT NULL DEFAULT false,
    "couldNotDownload" BOOLEAN NOT NULL DEFAULT false,
    "postMediaImagesHaveBeenProcessed" BOOLEAN NOT NULL DEFAULT false,
    "postThumbnailsCreated" BOOLEAN NOT NULL DEFAULT false,
    "postMediaImagesProcessingError" TEXT,
    "downloadError" TEXT,
    "mediaDownloadTries" INTEGER NOT NULL DEFAULT 0,
    "downloadedMediaCount" INTEGER NOT NULL DEFAULT 0,
    "downloadedMedia" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    CONSTRAINT "Posts_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feeds" ("uniqueId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feeds" (
    "uniqueId" TEXT NOT NULL PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "favourited" BOOLEAN NOT NULL DEFAULT false,
    "requiresBrowserForSraping" BOOLEAN NOT NULL DEFAULT false,
    "updateCheck_lastUpdated" INTEGER NOT NULL DEFAULT 0,
    "updateCheck_LastPostSeen" TEXT
);

-- CreateTable
CREATE TABLE "Tags" (
    "tag" TEXT NOT NULL PRIMARY KEY,
    "favourited" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Tags_Posts" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("postId", "tagId"),
    CONSTRAINT "Tags_Posts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Posts" ("uniqueId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Tags_Posts_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tags" ("tag") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tags_Feeds" (
    "feedId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("feedId", "tagId"),
    CONSTRAINT "Tags_Feeds_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feeds" ("uniqueId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Tags_Feeds_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tags" ("tag") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Posts_uniqueId_postId_feedId_timestamp_idx" ON "Posts"("uniqueId", "postId", "feedId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Posts_feedId_postId_key" ON "Posts"("feedId", "postId");

-- CreateIndex
CREATE INDEX "Feeds_uniqueId_domain_idx" ON "Feeds"("uniqueId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "Feeds_domain_name_key" ON "Feeds"("domain", "name");
