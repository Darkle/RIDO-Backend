-- CreateTable
CREATE TABLE "Settings" (
    "uniqueId" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    CONSTRAINT "Posts_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feeds" ("uniqueId") ON DELETE RESTRICT ON UPDATE CASCADE
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
CREATE TABLE "_PostToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PostToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Posts" ("uniqueId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PostToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tags" ("tag") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_FeedToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_FeedToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Feeds" ("uniqueId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FeedToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tags" ("tag") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Posts_uniqueId_postId_feedId_timestamp_idx" ON "Posts"("uniqueId", "postId", "feedId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Posts_feedId_postId_key" ON "Posts"("feedId", "postId");

-- CreateIndex
CREATE INDEX "Feeds_uniqueId_domain_idx" ON "Feeds"("uniqueId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "Feeds_domain_name_key" ON "Feeds"("domain", "name");

-- CreateIndex
CREATE UNIQUE INDEX "_PostToTag_AB_unique" ON "_PostToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_PostToTag_B_index" ON "_PostToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FeedToTag_AB_unique" ON "_FeedToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_FeedToTag_B_index" ON "_FeedToTag"("B");