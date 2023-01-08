import { F, G } from '@mobily/ts-belt'
import invariant from 'tiny-invariant'
import { PrismaClient, type Feed, type Log, type Post, type Settings, type Tag } from '@prisma/client'
import type { Jsonifiable } from 'type-fest'

import { EE } from './events'
import { nullable, type Maybe } from 'pratica'

type IncomingLog = Pick<Log, 'level'> &
  Partial<Pick<Log, 'message' | 'error' | 'service'>> & { readonly other?: Jsonifiable }

type IncomingPost = Pick<
  Post,
  'postId' | 'feedDomain' | 'title' | 'postUrl' | 'score' | 'timestamp' | 'mediaUrl' | 'feedId'
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

  static saveLog(log: IncomingLog): Promise<void> {
    const otherAsStr = log.other ? JSON.stringify(log.other) : undefined

    return prisma.log.create({ data: { ...log, other: otherAsStr } }).then(F.ignore)
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

    return prisma.log.findMany({
      where: {
        OR: [
          { message: { contains: searchQuery } },
          { service: { contains: searchQuery } },
          { error: { contains: searchQuery } },
          { other: { contains: searchQuery } },
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

    return prisma.log.findMany({
      where: {
        OR: [
          { message: { contains: searchQuery } },
          { service: { contains: searchQuery } },
          { error: { contains: searchQuery } },
          { other: { contains: searchQuery } },
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

  // eslint-disable-next-line max-lines-per-function
  static async batchAddPosts(
    posts: readonly IncomingPost[],
    feedDomain: Post['feedDomain'],
    feedName: Feed['name']
  ): Promise<void> {
    invariant(feedDomain.includes('.'), 'feedDomain is not a valid domain')

    const postsOwnerFeed = await prisma.feed.findFirst({ where: { domain: feedDomain, name: feedName } })

    invariant(postsOwnerFeed, 'There is no owner feed for these posts')

    //TODO: i need to connect each post to its feed
    const postsForDB = posts.map(data => prisma.post.create({ data }))

    //TODO: Check whats the max amount of posts insert can do.
    // return knex<Post>('Post')
    //   .insert(postsReadyForDB)
    //   .returning('postId')
    //   .onConflict()
    //   .ignore()
    //   .then(res =>
    //     knex<Feed>('Feed')
    //       .select('posts')
    //       .where({ feedDomain, feedId })
    //       .first()
    //       .then(feedPosts => {
    //         const currentFeedPosts = Array.isArray(feedPosts) ? feedPosts : []
    //         const insertedPostIds = res.map(post => post.postId)
    //         return knex<Feed>('Feed')
    //           .where({ feedDomain, feedId })
    //           .jsonSet('posts', '$', JSON.stringify([...currentFeedPosts, ...insertedPostIds]))
    //       })
    //   )
    //   .then(res => console.log(res))
    //   .then(F.ignore)
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

  static updatePostData(
    feedDomain: Post['feedDomain'],
    postId: Post['postId'],
    postDataUpdates: PostDataUpdates
  ): Promise<void> {
    return prisma.post
      .update({ where: { feedDomain_postId: { feedDomain, postId } }, data: postDataUpdates })
      .then(F.ignore)
  }

  static addFeed(feedName: Feed['name'], feedDomain: Feed['domain']): Promise<void> {
    invariant(feedDomain.includes('.'), 'feedDomain is not a valid domain')

    // Lowercase feed name for reddit as user may have different casing when input and dont want dupes. We dont do this for non reddit feed ids as casing would be important (eg a thread id of `pu38Fg8` where casing matters)
    const name = feedDomain === 'reddit.com' ? feedName.toLowerCase() : feedName

    return DB.getSingleFeed(feedName, feedDomain).then(res =>
      res.cata({
        Just: F.ignore,
        Nothing: () => prisma.feed.create({ data: { domain: feedDomain, name } }).then(F.ignore),
      })
    )
  }

  static getAllFeeds(): Promise<readonly Feed[]> {
    return prisma.feed.findMany()
  }

  static getSingleFeed(feedName: Feed['name'], feedDomain: Feed['domain']): Promise<Maybe<Feed>> {
    return prisma.feed.findFirst({ where: { name: feedName, domain: feedDomain } }).then(nullable)
  }

  static removeFeed(feedName: Feed['name'], feedDomain: Feed['domain']): Promise<void> {
    return prisma.feed
      .delete({ where: { name_and_domain: { name: feedName, domain: feedDomain } } })
      .then(F.ignore)
  }

  static getFavouriteFeeds(): Promise<readonly Feed[]> {
    return prisma.feed.findMany({ where: { favourited: true } })
  }

  static getFeedsThatNeedToBeUpdated(): Promise<readonly Feed[]> {
    const oneHourInMillisecs = 3_600_000
    const anHourAgo = (): number => Date.now() - oneHourInMillisecs

    return prisma.feed.findMany({ where: { updateCheck_lastUpdated: { lt: anHourAgo() } } })
  }

  static updateFeedLastUpdatedTimeToNow(feedName: Feed['name'], feedDomain: Feed['domain']): Promise<void> {
    return prisma.feed
      .update({
        where: { name_and_domain: { name: feedName, domain: feedDomain } },
        data: { updateCheck_lastUpdated: Date.now() },
      })
      .then(F.ignore)
  }

  // TODO: would a backlink help here? https://www.edgedb.com/docs/intro/schema#backlinks
  // static getFeedTagsAssociatedWithFeed() {
  //   return e.select()
  // }

  // static  getAllFeedTags(): Promise<readonly BaseTag[]> {
  //   return e.select(e.Tag, t => ({ ...tagShapeSansIdSansDBLinks(t) })).run(client)
  // }

  static addTag(tag: Tag['tag']): Promise<void> {
    return DB.getSingleTag(tag).then(res =>
      res.cata({
        Just: F.ignore,
        Nothing: () => prisma.tag.create({ data: { tag } }).then(F.ignore),
      })
    )
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
