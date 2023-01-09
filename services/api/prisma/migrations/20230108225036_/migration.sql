-- CreateTable
CREATE TABLE "Settings" (
    "uniqueId" TEXT NOT NULL DEFAULT 'settings',
    "numberMediaDownloadsAtOnce" INTEGER NOT NULL DEFAULT 2,
    "numberImagesProcessAtOnce" INTEGER NOT NULL DEFAULT 2,
    "updateAllDay" BOOLEAN NOT NULL DEFAULT true,
    "updateStartingHour" INTEGER NOT NULL DEFAULT 1,
    "updateEndingHour" INTEGER NOT NULL DEFAULT 7,
    "imageCompressionQuality" INTEGER NOT NULL DEFAULT 80,
    "archiveImageCompressionQuality" INTEGER NOT NULL DEFAULT 80,
    "maxImageWidthForNonArchiveImage" INTEGER NOT NULL DEFAULT 1400,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("uniqueId")
);

-- CreateTable
CREATE TABLE "Logs" (
    "uniqueId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "message" TEXT,
    "service" TEXT,
    "error" TEXT,
    "other" TEXT,

    CONSTRAINT "Logs_pkey" PRIMARY KEY ("uniqueId")
);

-- CreateTable
CREATE TABLE "Posts" (
    "uniqueId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "feedDomain" TEXT NOT NULL,
    "feedName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "postUrl" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaHasBeenDownloaded" BOOLEAN NOT NULL DEFAULT false,
    "couldNotDownload" BOOLEAN NOT NULL DEFAULT false,
    "postMediaImagesHaveBeenProcessed" BOOLEAN NOT NULL DEFAULT false,
    "postThumbnailsCreated" BOOLEAN NOT NULL DEFAULT false,
    "postMediaImagesProcessingError" TEXT,
    "downloadError" TEXT,
    "mediaDownloadTries" INTEGER NOT NULL DEFAULT 0,
    "downloadedMediaCount" INTEGER NOT NULL DEFAULT 0,
    "downloadedMedia" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "feedId" TEXT NOT NULL,

    CONSTRAINT "Posts_pkey" PRIMARY KEY ("uniqueId")
);

-- CreateTable
CREATE TABLE "Feeds" (
    "uniqueId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "favourited" BOOLEAN NOT NULL DEFAULT false,
    "requiresBrowserForSraping" BOOLEAN NOT NULL DEFAULT false,
    "updateCheck_lastUpdated" INTEGER NOT NULL DEFAULT 0,
    "updateCheck_LastPostSeen" TEXT,

    CONSTRAINT "Feeds_pkey" PRIMARY KEY ("uniqueId")
);

-- CreateTable
CREATE TABLE "Tags" (
    "tag" TEXT NOT NULL,
    "favourited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Tags_pkey" PRIMARY KEY ("tag")
);

-- CreateTable
CREATE TABLE "Tags_Posts" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "Tags_Posts_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "Tags_Feeds" (
    "feedId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "Tags_Feeds_pkey" PRIMARY KEY ("feedId","tagId")
);

-- CreateIndex
CREATE INDEX "Posts_uniqueId_postId_feedId_timestamp_idx" ON "Posts"("uniqueId", "postId", "feedId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Posts_feedDomain_postId_key" ON "Posts"("feedDomain", "postId");

-- CreateIndex
CREATE INDEX "Feeds_uniqueId_domain_idx" ON "Feeds"("uniqueId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "Feeds_domain_name_key" ON "Feeds"("domain", "name");

-- AddForeignKey
ALTER TABLE "Posts" ADD CONSTRAINT "Posts_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feeds"("uniqueId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tags_Posts" ADD CONSTRAINT "Tags_Posts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Posts"("uniqueId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tags_Posts" ADD CONSTRAINT "Tags_Posts_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tags"("tag") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tags_Feeds" ADD CONSTRAINT "Tags_Feeds_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feeds"("uniqueId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tags_Feeds" ADD CONSTRAINT "Tags_Feeds_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tags"("tag") ON DELETE CASCADE ON UPDATE CASCADE;
