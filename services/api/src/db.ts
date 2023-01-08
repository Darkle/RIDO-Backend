import { F } from '@mobily/ts-belt'
import invariant from 'tiny-invariant'
import { PrismaClient, type Feed, type Log, type Post, type Settings, type Tag } from '@prisma/client'
import type { Jsonifiable } from 'type-fest'

import { EE } from './events'
import { nullable, type Maybe } from 'pratica'

type IncomingLog = Pick<Log, 'level'> &
  Partial<Pick<Log, 'message' | 'error' | 'service'>> & {
    readonly other?: Jsonifiable
  }

type IncomingPost = Pick<
  Post,
  'postId' | 'feedDomain' | 'title' | 'postUrl' | 'score' | 'timestamp' | 'mediaUrl'
>

type PostDataUpdates = Partial<
  Pick<
    Post,
    | 'mediaHasBeenDownloaded'
    | 'couldNotDownload'
    | 'postMediaImagesHaveBeenProcessed'
    | 'postThumbnailsCreated'
    | 'postMediaImagesProcessingError'
    | 'downloadError'
    | 'mediaDownloadTries'
    | 'downloadedMediaCount'
    | 'downloadedMedia'
  >
>

const prisma = new PrismaClient({
  // https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/logging#the-log-option
  log: process.env['LOG_ALL_DB_QUERIES'] === 'true' ? ['query', 'info', 'warn', 'error'] : undefined,
})

class DB {
  static init(): Promise<void> {
    return prisma.settings
      .findFirst({ where: { uniqueId: 'settings' } })
      .then(nullable)
      .then(res =>
        res.cata({
          Just: F.ignore,
          Nothing: () => prisma.settings.create({ data: {} }).then(F.ignore),
        })
      )
  }

  readonly close = prisma.$disconnect

  static async getSettings(): Promise<Maybe<Settings>> {
    return prisma.settings.findFirst().then(nullable)
  }

  static updateSettings(setting: Partial<Settings>): Promise<void> {
    return prisma.settings
      .update({ where: { uniqueId: 'settings' }, data: setting })
      .then(updatedSettings => {
        EE.emit('settingsUpdate', updatedSettings)
      })
  }

  static async saveLog(log: IncomingLog): Promise<void> {
    const otherAsStr = log.other ? JSON.stringify(log.other) : undefined

    await prisma.log.create({ data: { ...log, other: otherAsStr } })
  }

  static getAllLogs_Paginated(page: number, limit: number): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit
    return prisma.log.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit })
  }

  static findLogs_AllLevels_WithSearch_Paginated(
    page: number,
    limit: number,
    searchQuery: string
  ): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit
    const sq = searchQuery.toLowerCase()

    return prisma.log.findMany({
      where: {
        OR: [
          { message: { contains: sq, mode: 'insensitive' } },
          { service: { contains: sq, mode: 'insensitive' } },
          { error: { contains: sq, mode: 'insensitive' } },
          { other: { contains: sq, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })
  }

  static findLogs_LevelFilter_NoSearch_Paginated(
    page: number,
    limit: number,
    logLevel: Log['level']
  ): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit

    return prisma.log.findMany({
      where: { level: logLevel },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })
  }

  static findLogs_LevelFilter_WithSearch_Paginated(
    page: number,
    limit: number,
    searchQuery: string,
    logLevel: Log['level']
  ): Promise<readonly Log[]> {
    const skip = page === 1 ? 0 : (page - 1) * limit
    const sq = searchQuery.toLowerCase()

    return prisma.log.findMany({
      where: {
        OR: [
          { message: { contains: sq, mode: 'insensitive' } },
          { service: { contains: sq, mode: 'insensitive' } },
          { error: { contains: sq, mode: 'insensitive' } },
          { other: { contains: sq, mode: 'insensitive' } },
          { AND: { level: logLevel } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })
  }

  static getAllPosts(): Promise<readonly Post[]> {
    return prisma.post.findMany()
  }

  static getSinglePost(feedDomain: Post['feedDomain'], postId: Post['postId']): Promise<Maybe<Post>> {
    return prisma.post.findFirst({ where: { feedDomain, postId } }).then(nullable)
  }

  static getSinglePostWithItsFeedAttatched(
    feedDomain: Post['feedDomain'],
    postId: Post['postId']
  ): Promise<Maybe<Post>> {
    return prisma.post.findFirst({ where: { feedDomain, postId }, include: { feed: true } }).then(nullable)
  }

  //TODO: Check whats the max amount of posts insert can do.
  static async batchAddPosts(
    // eslint-disable-next-line functional/prefer-readonly-type
    posts: IncomingPost[],
    feedDomain: Post['feedDomain'],
    feedName: Feed['name']
  ): Promise<void> {
    invariant(feedDomain.includes('.'), 'feedDomain is not a valid domain')

    const postsOwnerFeed = await prisma.feed.findFirst({ where: { domain: feedDomain, name: feedName } })

    invariant(postsOwnerFeed, 'There is no owner feed for these posts')

    const postsForDB = posts.map(post => ({ ...post, feedId: postsOwnerFeed.uniqueId }))

    await prisma.post.createMany({ data: postsForDB, skipDuplicates: true })
  }

  static getPostsThatNeedMediaToBeDownloaded(): Promise<readonly Post[]> {
    return prisma.post.findMany({ where: { mediaHasBeenDownloaded: false, couldNotDownload: false } })
  }

  static getPostsWhereImagesNeedToBeOptimized(): Promise<readonly Post[]> {
    return prisma.post.findMany({
      where: {
        mediaHasBeenDownloaded: true,
        couldNotDownload: false,
        postMediaImagesHaveBeenProcessed: false,
      },
    })
  }

  static async updatePostData(
    feedDomain: Post['feedDomain'],
    postId: Post['postId'],
    postDataUpdates: PostDataUpdates
  ): Promise<void> {
    await prisma.post.update({ where: { feedDomain_postId: { feedDomain, postId } }, data: postDataUpdates })
  }

  static async addFeed(feedName: Feed['name'], feedDomain: Feed['domain']): Promise<void> {
    invariant(feedDomain.includes('.'), 'feedDomain is not a valid domain')

    // Lowercase feed name for reddit as user may have different casing when input and dont want dupes. We dont do this for non reddit feed ids as casing would be important (eg a thread id of `pu38Fg8` where casing matters)
    const name = feedDomain === 'reddit.com' ? feedName.toLowerCase() : feedName

    // Using createMany to easily ignore duplicate
    await prisma.feed.createMany({ data: { domain: feedDomain, name }, skipDuplicates: true })
  }

  static getAllFeeds(): Promise<readonly Feed[]> {
    return prisma.feed.findMany()
  }

  static getSingleFeed(feedName: Feed['name'], feedDomain: Feed['domain']): Promise<Maybe<Feed>> {
    return prisma.feed.findFirst({ where: { name: feedName, domain: feedDomain } }).then(nullable)
  }

  static async removeFeed(feedName: Feed['name'], feedDomain: Feed['domain']): Promise<void> {
    await prisma.feed.delete({ where: { name_and_domain: { name: feedName, domain: feedDomain } } })
  }

  static getFavouriteFeeds(): Promise<readonly Feed[]> {
    return prisma.feed.findMany({ where: { favourited: true } })
  }

  static getFeedsThatNeedToBeUpdated(): Promise<readonly Feed[]> {
    const oneHourInMillisecs = 3_600_000
    const anHourAgo = (): number => Date.now() - oneHourInMillisecs

    return prisma.feed.findMany({ where: { updateCheck_lastUpdated: { lt: anHourAgo() } } })
  }

  static async updateFeedLastUpdatedTimeToNow(
    feedName: Feed['name'],
    feedDomain: Feed['domain']
  ): Promise<void> {
    await prisma.feed.update({
      where: { name_and_domain: { name: feedName, domain: feedDomain } },
      data: { updateCheck_lastUpdated: Date.now() },
    })
  }

  static async addTag(tag: Tag['tag']): Promise<void> {
    // Using createMany to easily ignore duplicate
    await prisma.tag.createMany({ data: { tag }, skipDuplicates: true })
  }

  static getSingleTag(tag: Tag['tag']): Promise<Maybe<Tag>> {
    return prisma.tag.findFirst({ where: { tag } }).then(nullable)
  }

  static getAllTags(): Promise<readonly Tag[]> {
    return prisma.tag.findMany()
  }

  static getFavouriteTags(): Promise<readonly Tag[]> {
    return prisma.tag.findMany({ where: { favourited: true } })
  }
}

export { DB }
