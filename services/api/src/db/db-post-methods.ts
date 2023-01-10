import type { Feed, Post } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { nullable, type Maybe } from 'pratica'
import invariant from 'tiny-invariant'

import { prisma } from './prisma-instance'

type IncomingPost = Pick<Post, 'postId' | 'title' | 'postUrl' | 'score' | 'timestamp' | 'mediaUrl'>

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

function getAllPosts(): Promise<readonly Post[]> {
  return prisma.post.findMany()
}

function getSinglePost(feedDomain: Post['feedDomain'], postId: Post['postId']): Promise<Maybe<Post>> {
  return prisma.post.findFirst({ where: { feedDomain, postId } }).then(nullable)
}

function getSinglePostWithItsFeed(
  feedDomain: Post['feedDomain'],
  postId: Post['postId']
): Promise<Maybe<Post>> {
  return prisma.post.findFirst({ where: { feedDomain, postId }, include: { feed: true } }).then(nullable)
}

async function batchAddPosts(
  posts: readonly IncomingPost[],
  feedDomain: Post['feedDomain'],
  feedName: Feed['name']
): Promise<void> {
  invariant(feedDomain.includes('.'), 'feedDomain is not a valid domain')

  const postsOwnerFeed = await prisma.feed.findFirst({ where: { domain: feedDomain, name: feedName } })

  invariant(postsOwnerFeed, 'There is no owner feed for these posts')

  // Lowercase feed name for reddit as user may have different casing when input and dont want dupes. We dont do this for non reddit feed ids as casing would be important (eg a thread id of `pu38Fg8` where casing matters)
  const name = feedDomain === 'reddit.com' ? feedName.toLowerCase() : feedName

  const postsForDB = posts.map(post => ({
    ...post,
    feedId: postsOwnerFeed.uniqueId,
    feedDomain,
    feedName: name,
  }))

  await prisma.post.createMany({ data: postsForDB, skipDuplicates: true })
}

function getPostsThatNeedMediaToBeDownloaded(): Promise<readonly Post[]> {
  return prisma.post.findMany({ where: { mediaHasBeenDownloaded: false, couldNotDownload: false } })
}

function getPostsWhereImagesNeedToBeOptimized(): Promise<readonly Post[]> {
  return prisma.post.findMany({
    where: {
      mediaHasBeenDownloaded: true,
      couldNotDownload: false,
      postMediaImagesHaveBeenProcessed: false,
    },
  })
}

async function updatePostData(
  feedDomain: Post['feedDomain'],
  postId: Post['postId'],
  postDataUpdates: PostDataUpdates
): Promise<void> {
  await prisma.post.update({ where: { feedDomain_postId: { feedDomain, postId } }, data: postDataUpdates })
}

// https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety/operating-against-partial-structures-of-model-types
const feedWithPosts = Prisma.validator<Prisma.FeedArgs>()({
  include: { posts: true },
})

type FeedWithPosts = Prisma.FeedGetPayload<typeof feedWithPosts>

function getPostsOfFeed(feedName: Feed['name'], feedDomain: Feed['domain']): Promise<Maybe<FeedWithPosts>> {
  return prisma.feed
    .findFirst({ where: { name: feedName, domain: feedDomain }, include: { posts: true } })
    .then(nullable)
}

export {
  getAllPosts,
  getSinglePost,
  getSinglePostWithItsFeed,
  batchAddPosts,
  getPostsThatNeedMediaToBeDownloaded,
  getPostsWhereImagesNeedToBeOptimized,
  updatePostData,
  getPostsOfFeed,
}

export type { IncomingPost }
