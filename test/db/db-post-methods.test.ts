import crypto from 'crypto'
import { setTimeout } from 'timers/promises'

import test from 'ava'
import { z } from 'zod'
import { DateTime } from 'luxon'
import { F } from '@mobily/ts-belt'

import '../../services/api/src/api'
import { PostModel } from '../../services/api/src/db/Post/PostEntity'
import { UserModel } from '../../services/api/src/db/User/UserEntity'
import type { UserType } from '../../services/api/src/db/User/UserEntity'
import type { PostType } from '../../services/api/src/db/Post/PostEntity'
import { TagModel } from '../../services/api/src/db/TagEntity'
import type { TagType } from '../../services/api/src/db/TagEntity'
import { localDateToGMTEpoch } from '../../services/api/src/utils'

const createDataPrefix = (): string => crypto.randomBytes(10).toString('hex')

const textWithPrefix = (dbDataPrefix: string, text: string): string => `${dbDataPrefix}-${text}`

const descTimestampSort = (a: { timestamp: number } | number, b: { timestamp: number } | number): number => {
  const aTimestamp = typeof a === 'number' ? a : a.timestamp
  const bTimestamp = typeof b === 'number' ? b : b.timestamp

  if (aTimestamp > bTimestamp) {
    return -1
  }

  if (aTimestamp < bTimestamp) {
    return 1
  }

  // a must be equal to b
  return 0
}

const randomSub = (dataPrefix: string, idx: number): string => {
  const sub = idx % 5 === 0 ? 'dogs' : idx % 2 === 0 ? 'aww' : idx % 3 === 0 ? 'cats' : 'goats'
  return textWithPrefix(dataPrefix, sub)
}

// these timestamps are from random reddit posts
const randomEpochGMTTimeStamp = (idx: number): number => {
  const timestamp =
    idx % 5 === 0 ? 1562253481 : idx % 2 === 0 ? 1654380013 : idx % 3 === 0 ? 1592410647 : 1491051474
  return timestamp + idx
}

const randomTag = (dataPrefix: string, idx: number): string => {
  const tag = idx % 5 === 0 ? 'hot' : idx % 11 === 0 ? 'cold' : idx % 3 === 0 ? 'milk' : 'bread'
  return textWithPrefix(dataPrefix, tag)
}

const getTimestampAndPostId = (
  post:
    | PostData
    | {
        postId: string
        subreddit: string
        postUrl: string
        score: number
        timestamp: number
        mediaUrl: string
        mediaHasBeenDownloaded: boolean
        postMediaImagesHaveBeenProcessed: boolean
        couldNotDownload: boolean
      }
): { timestamp: number; postId: string } => ({
  postId: post.postId,
  timestamp: post.timestamp,
})

type PostData = Omit<PostType, '_id' | 'mediaHasBeenDownloaded' | 'couldNotDownload' | 'tags'> & {
  tags?: Omit<TagType, '_id' | 'posts' | 'userOwnerId'>
}

test('DB::PostModel::addPost', async t => {
  const dataPrefix = createDataPrefix()
  const data: Pick<
    PostType,
    'postId' | 'title' | 'subreddit' | 'postUrl' | 'score' | 'timestamp' | 'mediaUrl'
  > = {
    postId: textWithPrefix(dataPrefix, '1209j'),
    subreddit: textWithPrefix(dataPrefix, 'aww'),
    title: 'title',
    postUrl: 'https://www.reddit.com/r/aww/comments/hyts0n/raww_has_a_discord_server/',
    score: 20,
    timestamp: 1595861810,
    mediaUrl: 'https://v.redd.it/rryae6ujiv291',
  }
  await PostModel.addPost(data)
  const post = await PostModel.findOne({ postId: data.postId }).lean().exec()

  const expectedDataShape = z
    .object({
      _id: z.instanceof(PostModel.base.Types.ObjectId),
      postId: z.literal(data.postId),
      title: z.string(),
      subreddit: z.literal(data.subreddit),
      postUrl: z.literal(data.postUrl),
      score: z.literal(data.score),
      timestamp: z.literal(data.timestamp),
      mediaUrl: z.literal(data.mediaUrl),
      mediaHasBeenDownloaded: z.literal(false),
      couldNotDownload: z.literal(false),
      postMediaImagesHaveBeenProcessed: z.literal(false),
      mediaDownloadTries: z.literal(0),
      postThumbnailsCreated: z.literal(false),
      downloadedMediaCount: z.literal(0),
      downloadedMedia: z.array(z.string()),
      tags: z.array(z.object({ _id: z.instanceof(TagModel.base.Types.ObjectId) })),
      __v: z.number(),
    })
    .strict()

  t.notThrows(() => expectedDataShape.parse(post))
  t.teardown(() => PostModel.deleteOne({ postId: data.postId }))
})

test('DB::PostModel::addPost::no duplicates', async t => {
  const dataPrefix = createDataPrefix()
  const data: Pick<
    PostType,
    'postId' | 'title' | 'subreddit' | 'postUrl' | 'score' | 'timestamp' | 'mediaUrl'
  > = {
    postId: textWithPrefix(dataPrefix, '1209j'),
    subreddit: textWithPrefix(dataPrefix, 'aww'),
    title: 'title',
    postUrl: 'https://www.reddit.com/r/aww/comments/hyts0n/raww_has_a_discord_server/',
    score: 20,
    timestamp: 1595861810,
    mediaUrl: 'https://v.redd.it/rryae6ujiv291',
  }
  await PostModel.addPost(data)

  await Promise.all([PostModel.addPost(data), PostModel.addPost(data)])

  const posts = await PostModel.find({ postId: data.postId }).lean().exec()

  t.true(posts.length === 1)
})

test('DB::PostModel::batchAddPosts', async t => {
  const dataPrefix = createDataPrefix()

  const testPostsData = Array.from({ length: 1000 }).map((_, idx) => ({
    postId: textWithPrefix(dataPrefix, `${idx}`),
    subreddit: randomSub(dataPrefix, idx),
    title: 'title',
    postUrl: 'https://www.reddit.com/r/aww/comments/hyts0n/raww_has_a_discord_server/',
    score: 20 + idx,
    timestamp: randomEpochGMTTimeStamp(idx),
    mediaUrl: 'https://v.redd.it/rryae6ujiv291',
  }))

  await PostModel.batchAddPosts(testPostsData)

  const posts = await PostModel.find({ postId: { $regex: `^${dataPrefix}` } })
    .lean()
    .exec()

  t.true(posts.length === testPostsData.length)

  const expectedDataShape = z
    .object({
      _id: z.instanceof(PostModel.base.Types.ObjectId),
      postId: z.string(),
      title: z.string(),
      subreddit: z.string(),
      postUrl: z.string(),
      score: z.number(),
      timestamp: z.number(),
      mediaUrl: z.string().url().min(7),
      mediaHasBeenDownloaded: z.literal(false),
      couldNotDownload: z.literal(false),
      postMediaImagesHaveBeenProcessed: z.literal(false),
      mediaDownloadTries: z.literal(0),
      postThumbnailsCreated: z.literal(false),
      downloadedMediaCount: z.literal(0),
      downloadedMedia: z.array(z.undefined()),
      tags: z.array(z.object({ _id: z.instanceof(TagModel.base.Types.ObjectId) })),
      __v: z.number(),
    })
    .strict()

  t.notThrows(() => posts.forEach(post => expectedDataShape.parse(post)))
})

test('DB::PostModel::batchAddPosts::no duplicates', async t => {
  // Need to wait a moment for the mongoose connection, otherwise bulk.insert not yet ready
  await setTimeout(100)

  const dataPrefix = createDataPrefix()

  const testPostsData1 = Array.from({ length: 100 }).map((_, idx) => ({
    postId: textWithPrefix(dataPrefix, `${idx}`),
    subreddit: randomSub(dataPrefix, idx),
    title: 'title',
    postUrl: 'https://www.reddit.com/r/aww/comments/hyts0n/raww_has_a_discord_server/',
    score: 20 + idx,
    timestamp: randomEpochGMTTimeStamp(idx),
    mediaUrl: 'https://v.redd.it/rryae6ujiv291',
    mediaHasBeenDownloaded: true,
    postMediaImagesHaveBeenProcessed: true,
    couldNotDownload: false,
  }))

  const testPostsData2 = Array.from({ length: 100 }).map((_, idx) => ({
    postId: textWithPrefix(dataPrefix, `${idx}`),
    subreddit: randomSub(dataPrefix, idx),
    title: 'title',
    postUrl: 'https://www.reddit.com/r/aww/comments/hyts0n/raww_has_a_discord_server/',
    score: 20 + idx,
    timestamp: randomEpochGMTTimeStamp(idx),
    mediaUrl: 'https://v.redd.it/rryae6ujiv291',
    mediaHasBeenDownloaded: true,
    postMediaImagesHaveBeenProcessed: true,
    couldNotDownload: false,
  }))

  await PostModel.batchAddPosts(testPostsData1)

  await PostModel.batchAddPosts(testPostsData2)

  const posts = await PostModel.find({ postId: { $regex: `^${dataPrefix}` } })
    .lean()
    .exec()

  t.true(posts.length === testPostsData1.length)

  await PostModel.deleteMany({ postId: { $regex: `^${dataPrefix}` } })

  // check with duplicates in a single batch insert
  const testPostsData3 = Array.from({ length: 100 }).map((_, idx) => ({
    postId: idx % 2 === 0 ? textWithPrefix(dataPrefix, `${idx}`) : 'a',
    subreddit: randomSub(dataPrefix, idx),
    title: 'title',
    postUrl: 'https://www.reddit.com/r/aww/comments/hyts0n/raww_has_a_discord_server/',
    score: 20 + idx,
    timestamp: randomEpochGMTTimeStamp(idx),
    mediaUrl: 'https://v.redd.it/rryae6ujiv291',
    mediaHasBeenDownloaded: true,
    postMediaImagesHaveBeenProcessed: true,
    couldNotDownload: false,
  }))

  await PostModel.batchAddPosts(testPostsData3)

  const posts2 = await Promise.all([
    PostModel.find({ postId: { $regex: `^${dataPrefix}` } })
      .lean()
      .exec(),
    PostModel.find({ postId: 'a' }).lean().exec(),
  ]).then(p => p.flat())

  // +1 for the 'a' post
  t.true(posts2.length === testPostsData3.length / 2 + 1)
})

test('DB::PostModel::getPostsWhereImagesNeedToBeOptimized', async t => {
  const dataPrefix = createDataPrefix()

  const data = Array.from({ length: 25 }).map((_, idx) => ({
    postId: textWithPrefix(dataPrefix, `${idx}`),
    subreddit: textWithPrefix(dataPrefix, 'aww'),
    title: 'title',
    postUrl: 'https://www.reddit.com/r/aww/comments/hyts0n/raww_has_a_discord_server/',
    score: 20,
    timestamp: 1595861810,
    mediaUrl: 'https://v.redd.it/rryae6ujiv291',
    mediaHasBeenDownloaded: idx % 2 === 0,
    couldNotDownload: idx % 3 === 0,
    postMediaImagesHaveBeenProcessed: idx % 4 === 0,
    mediaDownloadTries: 0,
    postThumbnailsCreated: idx % 4 === 0,
  }))

  await PostModel.insertMany(data)

  const posts = (await PostModel.getPostsWhereImagesNeedToBeOptimized(dataPrefix)) as Omit<PostType, '_id'>[]

  t.is(posts.length, 4)
  t.teardown(() => PostModel.deleteMany({ postId: { $in: data.map(({ postId }) => postId) } }))
})

// Splitting up into individual tests should be fine as we use an extra maybeExtraFilterForTesting filter
// in findPosts_PaginatedData which filters posts by the dataPrefix
async function mockFindPosts_PaginatedData(): Promise<
  [
    string,
    UserType,
    {
      postId: string
      title: string
      subreddit: string
      postUrl: string
      score: number
      timestamp: number
      mediaUrl: string
      mediaHasBeenDownloaded: boolean
      postMediaImagesHaveBeenProcessed: boolean
      couldNotDownload: boolean
    }[]
  ]
> {
  const dataPrefix = createDataPrefix()

  const user = (await UserModel.createUser({ name: textWithPrefix(dataPrefix, `merp`) })) as UserType

  await Promise.all([
    UserModel.createUserTag({ userOwnerId: user._id, tag: textWithPrefix(dataPrefix, `hot`) }),
    UserModel.createUserTag({ userOwnerId: user._id, tag: textWithPrefix(dataPrefix, `cold`) }),
    UserModel.createUserTag({ userOwnerId: user._id, tag: textWithPrefix(dataPrefix, `milk`) }),
    UserModel.createUserTag({ userOwnerId: user._id, tag: textWithPrefix(dataPrefix, `bread`) }),
    UserModel.createUserTag({ userOwnerId: user._id, tag: textWithPrefix(dataPrefix, `simpsons`) }),
    UserModel.createUserFeed({ userOwnerId: user._id, subreddit: textWithPrefix(dataPrefix, `aww`) }),
    UserModel.createUserFeed({ userOwnerId: user._id, subreddit: textWithPrefix(dataPrefix, `cats`) }),
    UserModel.createUserFeed({ userOwnerId: user._id, subreddit: textWithPrefix(dataPrefix, `dogs`) }),
    UserModel.createUserFeed({ userOwnerId: user._id, subreddit: textWithPrefix(dataPrefix, `goats`) }),
    UserModel.createUserFeedGroup({
      userOwnerId: user._id,
      group: textWithPrefix(dataPrefix, `fav-feeds`),
    }),
    UserModel.createUserFeedGroup({
      userOwnerId: user._id,
      group: textWithPrefix(dataPrefix, `least-fav-feeds`),
    }),
    UserModel.createUserFeedGroup({
      userOwnerId: user._id,
      group: textWithPrefix(dataPrefix, `animals`),
    }),
  ])

  const testPostsData = Array.from({ length: 300 }).map((_, idx) => ({
    postId: textWithPrefix(dataPrefix, `${idx}`),
    subreddit: randomSub(dataPrefix, idx),
    title: 'title',
    postUrl: 'https://www.reddit.com/r/aww/comments/hyts0n/raww_has_a_discord_server/',
    score: 20 + idx,
    timestamp: randomEpochGMTTimeStamp(idx),
    mediaUrl: 'https://v.redd.it/rryae6ujiv291',
    mediaHasBeenDownloaded: true,
    postMediaImagesHaveBeenProcessed: true,
    couldNotDownload: false,
  }))

  await PostModel.insertMany(testPostsData)

  await Promise.all([
    ...testPostsData.map((post, idx) =>
      UserModel.assignUserTagToPost({
        userOwnerId: user._id,
        tag: randomTag(dataPrefix, idx),
        postId: post.postId,
      })
    ),
    // add a second tag to some posts
    ...testPostsData.map((post, idx) =>
      idx % 5 === 0
        ? UserModel.assignUserTagToPost({
            userOwnerId: user._id,
            tag: textWithPrefix(dataPrefix, 'simpsons'),
            postId: post.postId,
          })
        : Promise.resolve()
    ),
    UserModel.assignFeedToUserFeedGroup({
      group: textWithPrefix(dataPrefix, `fav-feeds`),
      userOwnerId: user._id,
      subreddit: textWithPrefix(dataPrefix, `aww`),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: textWithPrefix(dataPrefix, `animals`),
      userOwnerId: user._id,
      subreddit: textWithPrefix(dataPrefix, `aww`),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: textWithPrefix(dataPrefix, `least-fav-feeds`),
      userOwnerId: user._id,
      subreddit: textWithPrefix(dataPrefix, `cats`),
    }),
  ])

  return [dataPrefix, user, testPostsData]
}

test('DB::PostModel::findPosts_Paginated', async t => {
  const [dataPrefix, user, testPostsData] = await mockFindPosts_PaginatedData()

  const results = await PostModel.findPosts_Paginated({ userId: user._id }, dataPrefix)

  if (results instanceof Error) {
    throw results
  }

  t.is(results.posts.length, 100)
  t.is(results.totalCount, 300)
  // check the sorting is right
  t.deepEqual(
    results.posts.map(getTimestampAndPostId),
    testPostsData.map(getTimestampAndPostId).sort(descTimestampSort).slice(0, 100)
  )
})

test('DB::PostModel::findPosts_Paginated::postsTagFilterCheck', async t => {
  const [dataPrefix, user, testPostsData] = await mockFindPosts_PaginatedData()

  const postsTagFilterCheck = await PostModel.findPosts_Paginated(
    { userId: user._id, tags: [textWithPrefix(dataPrefix, `cold`)] },
    dataPrefix
  )

  if (postsTagFilterCheck instanceof Error) {
    throw postsTagFilterCheck
  }

  t.is(postsTagFilterCheck.posts.length, 22)
  t.is(postsTagFilterCheck.totalCount, 22)

  t.deepEqual(
    postsTagFilterCheck.posts.map(getTimestampAndPostId),
    testPostsData
      .map((post, idx) => ({
        ...post,
        tags: [{ tag: randomTag(dataPrefix, idx) }],
      }))
      .filter(({ tags }) => tags?.find(tag => tag.tag === textWithPrefix(dataPrefix, `cold`)))
      .map(getTimestampAndPostId)
      .sort(descTimestampSort)
      .slice(0, 100)
  )
})

test('DB::PostModel::findPosts_Paginated::postsMultipleTagFilterCheck', async t => {
  const [dataPrefix, user, testPostsData] = await mockFindPosts_PaginatedData()

  const postsMultipleTagFilterCheck = await PostModel.findPosts_Paginated(
    {
      userId: user._id,
      tags: [textWithPrefix(dataPrefix, `hot`), textWithPrefix(dataPrefix, `simpsons`)],
    },
    dataPrefix
  )

  if (postsMultipleTagFilterCheck instanceof Error) {
    throw postsMultipleTagFilterCheck
  }

  t.is(postsMultipleTagFilterCheck.posts.length, 60)
  t.is(postsMultipleTagFilterCheck.totalCount, 60)

  t.deepEqual(
    postsMultipleTagFilterCheck.posts.map(getTimestampAndPostId),
    testPostsData
      .map((post, idx) => ({
        ...post,
        // This mimicks what we do in mockFindPosts_PaginatedData
        tags: [
          { tag: randomTag(dataPrefix, idx) },
          ...(idx % 5 === 0 ? [{ tag: textWithPrefix(dataPrefix, 'simpsons') }] : []),
        ],
      }))
      .filter(
        ({ tags }) =>
          tags?.find(tag => tag.tag === textWithPrefix(dataPrefix, `hot`)) &&
          tags?.find(tag => tag.tag === textWithPrefix(dataPrefix, `simpsons`))
      )
      .map(getTimestampAndPostId)
      .sort(descTimestampSort)
      .slice(0, 100)
  )
})

test('DB::PostModel::findPosts_Paginated::postsFeedFilterCheck', async t => {
  const [dataPrefix, user, testPostsData] = await mockFindPosts_PaginatedData()

  const postsFeedFilterCheck = await PostModel.findPosts_Paginated(
    { subreddits: [textWithPrefix(dataPrefix, `goats`)], userId: user._id },
    dataPrefix
  )

  if (postsFeedFilterCheck instanceof Error) {
    throw postsFeedFilterCheck
  }

  t.is(postsFeedFilterCheck.posts.length, 80)
  t.is(postsFeedFilterCheck.totalCount, 80)

  t.deepEqual(
    postsFeedFilterCheck.posts.map(getTimestampAndPostId),
    testPostsData
      .filter(({ subreddit }) => subreddit === textWithPrefix(dataPrefix, `goats`))
      .map(getTimestampAndPostId)
      .sort(descTimestampSort)
      .slice(0, 100)
  )
})

test('DB::PostModel::findPosts_Paginated::postsMultipleFeedFilterCheck', async t => {
  const [dataPrefix, user, testPostsData] = await mockFindPosts_PaginatedData()

  const postsMultipleFeedFilterCheck = await PostModel.findPosts_Paginated(
    {
      subreddits: [textWithPrefix(dataPrefix, `goats`), textWithPrefix(dataPrefix, `cats`)],
      userId: user._id,
    },
    dataPrefix
  )

  if (postsMultipleFeedFilterCheck instanceof Error) {
    throw postsMultipleFeedFilterCheck
  }

  t.is(postsMultipleFeedFilterCheck.posts.length, 100)
  t.is(postsMultipleFeedFilterCheck.totalCount, 120)

  t.deepEqual(
    postsMultipleFeedFilterCheck.posts.map(getTimestampAndPostId),
    testPostsData
      .filter(
        ({ subreddit }) =>
          subreddit === textWithPrefix(dataPrefix, `goats`) ||
          subreddit === textWithPrefix(dataPrefix, `cats`)
      )
      .map(getTimestampAndPostId)
      .sort(descTimestampSort)
      .slice(0, 100)
  )
})

test('DB::PostModel::findPosts_Paginated::postsPageCheck', async t => {
  const [dataPrefix, user, testPostsData] = await mockFindPosts_PaginatedData()

  const postsPageCheck = await PostModel.findPosts_Paginated({ userId: user._id, page: 2 }, dataPrefix)

  if (postsPageCheck instanceof Error) {
    throw postsPageCheck
  }

  t.is(postsPageCheck.posts.length, 100)
  t.is(postsPageCheck.totalCount, 300)
  // check both the sorting and the page+limit is right
  t.deepEqual(
    postsPageCheck.posts.map(getTimestampAndPostId),
    testPostsData.map(getTimestampAndPostId).sort(descTimestampSort).slice(100, 200)
  )
})

test('DB::PostModel::findPosts_Paginated::postsAfterDateCheck', async t => {
  const [dataPrefix, user, testPostsData] = await mockFindPosts_PaginatedData()

  const date = DateTime.fromHTTP('Wed, 17 Jun 2020 16:21:36 GMT')

  const postsAfterDateCheck = await PostModel.findPosts_Paginated(
    // This is just a random testPostsData's post time in nice formatting.
    { userId: user._id, afterDate: date.toJSDate() },
    dataPrefix
  )

  if (postsAfterDateCheck instanceof Error) {
    throw postsAfterDateCheck
  }

  t.is(postsAfterDateCheck.posts.length, 100)
  t.is(postsAfterDateCheck.totalCount, 126)
  // check the sorting is right and the posts are within range
  t.deepEqual(
    postsAfterDateCheck.posts.map(getTimestampAndPostId),
    testPostsData
      .map(getTimestampAndPostId)
      .sort(descTimestampSort)
      .filter(post => post.timestamp > date.toSeconds())
      .slice(0, 100)
  )
})

test('DB::PostModel::findPosts_Paginated::postsBeforeDateCheck', async t => {
  const [dataPrefix, user, testPostsData] = await mockFindPosts_PaginatedData()

  const date = DateTime.fromHTTP('Wed, 17 Jun 2020 16:21:36 GMT')

  const postsBeforeDateCheck = await PostModel.findPosts_Paginated(
    // This is just a random testPostsData's post time in nice formatting.
    { userId: user._id, beforeDate: date.toJSDate() },
    dataPrefix
  )

  if (postsBeforeDateCheck instanceof Error) {
    throw postsBeforeDateCheck
  }

  t.is(postsBeforeDateCheck.posts.length, 100)
  t.is(postsBeforeDateCheck.totalCount, 173)
  // check the sorting is right and the posts are within range
  t.deepEqual(
    postsBeforeDateCheck.posts.map(getTimestampAndPostId),
    testPostsData
      .map(getTimestampAndPostId)
      .sort(descTimestampSort)
      .filter(post => post.timestamp < date.toSeconds())
      .slice(0, 100)
  )
})

test('DB::PostModel::findPosts_Paginated::postsBeforeAndAfterDateCheck', async t => {
  const [dataPrefix, user, testPostsData] = await mockFindPosts_PaginatedData()

  // These are just a random testPostsData's post time in nice formatting.
  const beforeDate = DateTime.fromHTTP('Sat, 04 Jun 2022 22:00:39 GMT')
  const afterDate = DateTime.fromHTTP('Thu, 04 Jul 2019 15:21:06 GMT')

  const postsBeforeAndAfterDateCheck = await PostModel.findPosts_Paginated(
    { userId: user._id, beforeDate: beforeDate.toJSDate(), afterDate: afterDate.toJSDate() },
    dataPrefix
  )

  if (postsBeforeAndAfterDateCheck instanceof Error) {
    throw postsBeforeAndAfterDateCheck
  }

  t.is(postsBeforeAndAfterDateCheck.posts.length, 72)
  t.is(postsBeforeAndAfterDateCheck.totalCount, 72)
  // check the sorting is right and the posts are within range
  t.deepEqual(
    postsBeforeAndAfterDateCheck.posts.map(getTimestampAndPostId),
    testPostsData
      .map(getTimestampAndPostId)
      .sort(descTimestampSort)
      .filter(post => post.timestamp < beforeDate.toSeconds() && post.timestamp > afterDate.toSeconds())
      .slice(0, 100)
  )
})

test('DB::PostModel::findPosts_Paginated::postsBeforeAndAfterDateCheckBadBeforeDate', async t => {
  const [dataPrefix, user] = await mockFindPosts_PaginatedData()

  const badBeforeDate = DateTime.fromISO('2015-05-25')
  const afterDate = DateTime.fromISO('2016-05-25')

  // This test checks both scenarios
  const postsBeforeAndAfterDateCheckBadBeforeDate = (await PostModel.findPosts_Paginated(
    { userId: user._id, beforeDate: badBeforeDate.toJSDate(), afterDate: afterDate.toJSDate() },
    dataPrefix
  ).catch(F.identity)) as Error

  t.true(postsBeforeAndAfterDateCheckBadBeforeDate instanceof Error)
  t.is(postsBeforeAndAfterDateCheckBadBeforeDate.message, 'afterDate should not come after beforeDate')
})

test('DB::PostModel::findPosts_Paginated::postsBeforeAndAfterDateCheckSameDates', async t => {
  const [dataPrefix, user] = await mockFindPosts_PaginatedData()

  const date = DateTime.fromISO('2015-05-25')

  const postsBeforeAndAfterDateCheckSameDates = (await PostModel.findPosts_Paginated(
    { userId: user._id, beforeDate: date.toJSDate(), afterDate: date.toJSDate() },
    dataPrefix
  ).catch(F.identity)) as Error

  t.true(postsBeforeAndAfterDateCheckSameDates instanceof Error)
  t.is(postsBeforeAndAfterDateCheckSameDates.message, 'date filters cannot be the same')
})

test('DB::PostModel::findPosts_Paginated::ascSort', async t => {
  const [dataPrefix, user, testPostsData] = await mockFindPosts_PaginatedData()

  const ascendingTimestampSort = (a: { timestamp: number }, b: { timestamp: number }): number => {
    if (a.timestamp < b.timestamp) {
      return -1
    }

    if (a.timestamp > b.timestamp) {
      return 1
    }

    // a must be equal to b
    return 0
  }

  const results = await PostModel.findPosts_Paginated({ userId: user._id, sortOrder: 'asc' }, dataPrefix)

  if (results instanceof Error) {
    throw results
  }

  t.is(results.posts.length, 100)
  t.is(results.totalCount, 300)
  // check the sorting is right
  t.deepEqual(
    results.posts.map(getTimestampAndPostId),
    testPostsData.map(getTimestampAndPostId).sort(ascendingTimestampSort).slice(0, 100)
  )
})

test('DB::PostModel::findPosts_Paginated::multipleFilters', async t => {
  const [dataPrefix, user, testPostsData] = await mockFindPosts_PaginatedData()

  const date = DateTime.fromHTTP('Wed, 17 Jun 2020 16:18:06 GMT')

  const postsMultipleFiltersCheck = await PostModel.findPosts_Paginated(
    {
      userId: user._id,
      tags: [textWithPrefix(dataPrefix, `milk`)],
      subreddits: [textWithPrefix(dataPrefix, `cats`)],
      afterDate: date.toJSDate(),
    },
    dataPrefix
  )

  if (postsMultipleFiltersCheck instanceof Error) {
    throw postsMultipleFiltersCheck
  }

  t.is(postsMultipleFiltersCheck.posts.length, 31)
  t.is(postsMultipleFiltersCheck.totalCount, 31)

  t.deepEqual(
    postsMultipleFiltersCheck.posts.map(getTimestampAndPostId),
    testPostsData
      .map((post, idx) => ({
        ...post,
        // This mimicks what we do in mockFindPosts_PaginatedData
        tags: [
          { tag: randomTag(dataPrefix, idx) },
          ...(idx % 5 === 0 ? [{ tag: textWithPrefix(dataPrefix, 'simpsons') }] : []),
        ],
      }))
      .filter(
        ({ tags, subreddit, timestamp }) =>
          tags?.find(tag => tag.tag === textWithPrefix(dataPrefix, `milk`)) &&
          subreddit === textWithPrefix(dataPrefix, `cats`) &&
          timestamp > localDateToGMTEpoch(date.toJSDate())
      )
      .map(getTimestampAndPostId)
      .sort(descTimestampSort)
      .slice(0, 100)
  )
})

test('DB::PostModel::findPosts_Paginated::random', async t => {
  const [dataPrefix, user] = await mockFindPosts_PaginatedData()

  const postsRandomSortCheck1 = await PostModel.findPosts_Paginated(
    { userId: user._id, sortOrder: 'random' },
    dataPrefix
  )

  if (postsRandomSortCheck1 instanceof Error) {
    throw postsRandomSortCheck1
  }

  t.is(postsRandomSortCheck1.posts.length, 100)
  t.is(postsRandomSortCheck1.totalCount, 300)

  const postsRandomSortCheck2 = await PostModel.findPosts_Paginated(
    { userId: user._id, sortOrder: 'random' },
    dataPrefix
  )

  if (postsRandomSortCheck2 instanceof Error) {
    throw postsRandomSortCheck2
  }

  t.notDeepEqual(
    postsRandomSortCheck1.posts.map(getTimestampAndPostId),
    postsRandomSortCheck2.posts.map(getTimestampAndPostId)
  )

  const date = DateTime.fromHTTP('Wed, 17 Jun 2020 16:18:06 GMT')

  const postsMultipleFiltersCheckWithRandomSort = await PostModel.findPosts_Paginated(
    {
      userId: user._id,
      tags: [textWithPrefix(dataPrefix, `milk`)],
      subreddits: [textWithPrefix(dataPrefix, `cats`)],
      afterDate: date.toJSDate(),
      sortOrder: 'random',
    },
    dataPrefix
  )

  if (postsMultipleFiltersCheckWithRandomSort instanceof Error) {
    throw postsMultipleFiltersCheckWithRandomSort
  }

  t.is(postsMultipleFiltersCheckWithRandomSort.posts.length, 31)
  t.is(postsMultipleFiltersCheckWithRandomSort.totalCount, 31)

  // check for any posts that dont have the milk tag
  t.falsy(
    postsMultipleFiltersCheckWithRandomSort.posts.find(
      post =>
        // @ts-expect-error
        post?.tags?.find(tag => tag.tag !== textWithPrefix(dataPrefix, `milk`)) // eslint-disable-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    )
  )

  t.falsy(
    postsMultipleFiltersCheckWithRandomSort.posts.find(
      post => post.subreddit !== textWithPrefix(dataPrefix, `cats`)
    )
  )

  t.falsy(
    postsMultipleFiltersCheckWithRandomSort.posts.find(
      post => post.timestamp < localDateToGMTEpoch(date.toJSDate())
    )
  )
})
