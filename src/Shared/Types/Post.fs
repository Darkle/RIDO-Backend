module Post

type Post =
    { postId: string
      subreddit: string
      title: string
      postUrl: string
      score: int
      timestamp: int
      mediaUrl: string
      mediaHasBeenDownloaded: bool
      couldNotDownload: bool
      postMediaImagesHaveBeenProcessed: bool
      postMediaImagesProcessingError: string option
      postThumbnailsCreated: bool
      mediaDownloadTries: int
      downloadedMediaCount: int
      downloadError: string option
      downloadedMedia: string option }
