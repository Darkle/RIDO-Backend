namespace RIDOTypes

[<CLIMutable>]
type Post =
    { postId: string
      subreddit: string
      title: string
      postUrl: string
      score: int64
      timestamp: int64
      mediaUrl: string
      mediaHasBeenDownloaded: bool
      couldNotDownload: bool
      postMediaImagesHaveBeenProcessed: bool
      postMediaImagesProcessingError: string option
      postThumbnailsCreated: bool
      mediaDownloadTries: int64
      downloadedMediaCount: int64
      downloadError: string option
      downloadedMedia: string option }
