import crypto from 'crypto'

import anyTest from 'ava'
import type { TestFn } from 'ava'
import { z } from 'zod'

import '../../services/api/src/api' // so we connect to db
import { UserModel } from '../../services/api/src/db/User/UserEntity'
import type { UserType } from '../../services/api/src/db/User/UserEntity'
import { FeedModel } from '../../services/api/src/db/FeedEntity'
import type { FeedType } from '../../services/api/src/db/FeedEntity'
import { PostModel } from '../../services/api/src/db/Post/PostEntity'
import type { PostType } from '../../services/api/src/db/Post/PostEntity'
import { TagModel } from '../../services/api/src/db/TagEntity'
import type { TagType } from '../../services/api/src/db/TagEntity'
import { FeedGroupModel } from '../../services/api/src/db/FeedGroupEntity'
import type { FeedGroupType } from '../../services/api/src/db/FeedGroupEntity'

const test = anyTest as TestFn<{ dataPrefix: string; user1: UserType; user2: UserType }>

const textWithPrefix = (dbDataPrefix: string, text: string): string => `${dbDataPrefix}-${text}`

// these timestamps are from random reddit posts
const randomEpochGMTTimeStamp = (idx: number): number => {
  const timestamp =
    idx % 5 === 0 ? 1562253481 : idx % 2 === 0 ? 1654380013 : idx % 3 === 0 ? 1592410647 : 1491051474
  return timestamp + idx
}

test.beforeEach(async t => {
  const dataPrefix = crypto.randomBytes(10).toString('hex')

  const createdUser1 = (await UserModel.createUser({ name: textWithPrefix(dataPrefix, `Homer`) })) as UserType
  const createdUser2 = (await UserModel.createUser({ name: textWithPrefix(dataPrefix, `Bart`) })) as UserType

  const testPostsData = Array.from({ length: 300 }).map((_, idx) => ({
    postId: textWithPrefix(dataPrefix, `${idx}`),
    subreddit: textWithPrefix(dataPrefix, idx % 2 === 0 ? 'aww' : 'cats'),
    title: 'title',
    postUrl: 'https://www.reddit.com/r/aww/comments/hyts0n/raww_has_a_discord_server/',
    score: 20 + idx,
    timestamp: randomEpochGMTTimeStamp(idx),
    mediaUrl: 'https://v.redd.it/rryae6ujiv291',
    mediaHasBeenDownloaded: true,
    postMediaImagesHaveBeenProcessed: true,
    couldNotDownload: false,
  }))

  await Promise.all([
    await UserModel.createUserFeed({
      subreddit: textWithPrefix(dataPrefix, 'aww'),
      userOwnerId: createdUser1._id,
    }),
    await UserModel.createUserFeed({
      subreddit: textWithPrefix(dataPrefix, 'cats'),
      userOwnerId: createdUser1._id,
    }),
    await UserModel.createUserFeed({
      subreddit: textWithPrefix(dataPrefix, 'aww'),
      userOwnerId: createdUser2._id,
    }),
    PostModel.insertMany(testPostsData),
  ])

  t.context.dataPrefix = dataPrefix
  t.context.user1 = createdUser1
  t.context.user2 = createdUser2
})

test('DB::UserModel::createUser', async t => {
  // User is created in test.beforeEach
  const foundUser = await UserModel.findById(t.context.user1._id).lean().exec()

  const expectedDataShape = z
    .object({
      _id: z.string().uuid(),
      name: z.literal(t.context.user1.name),
      settings: z.object({ hasSeenWelcomeMessage: z.boolean() }),
      postTags: z.array(z.undefined()).length(0),
      feedGroups: z.array(z.undefined()).length(0),
      __v: z.number(),
    })
    .strict()

  t.notThrows(() => expectedDataShape.parse(foundUser))
})

test('DB::UserModel::createUser::can have different users with same name', async t => {
  const dataPrefix = crypto.randomBytes(10).toString('hex')
  const userName = textWithPrefix(dataPrefix, `Homer`)

  await Promise.all([UserModel.createUser({ name: userName }), UserModel.createUser({ name: userName })])

  const foundUsers = await UserModel.find({ name: userName }).lean().exec()

  t.true(foundUsers.length === 2)
})

test('DB::UserModel::getUserFavourites', async t => {
  const feedGroup1 = textWithPrefix(t.context.dataPrefix, `group-a`)
  const feedGroup2 = textWithPrefix(t.context.dataPrefix, `group-b`)
  const tag = textWithPrefix(t.context.dataPrefix, `tag-1`)
  const tag2 = textWithPrefix(t.context.dataPrefix, `tag-2`)

  await Promise.all([
    UserModel.createUserFeedGroup({ group: feedGroup1, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeedGroup({ group: feedGroup2, userOwnerId: t.context.user1._id }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup1,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup2,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup1,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'cats'),
    }),
    UserModel.createUserTag({ tag, userOwnerId: t.context.user1._id }),
    UserModel.createUserTag({ tag: tag2, userOwnerId: t.context.user1._id }),
  ])

  await Promise.all([
    FeedModel.findOneAndUpdate(
      { userOwnerId: t.context.user1._id, subreddit: textWithPrefix(t.context.dataPrefix, 'aww') },
      { favourited: true }
    ),
    FeedGroupModel.findOneAndUpdate(
      { userOwnerId: t.context.user1._id, group: feedGroup1 },
      { favourited: true }
    ),
    TagModel.findOneAndUpdate({ userOwnerId: t.context.user1._id, tag }, { favourited: true }),
  ])

  const userFavs = await UserModel.getUserFavourites(t.context.user1._id)

  const expectedDataShape = z
    .object({
      subs: z.array(z.object({ subreddit: z.string().min(1) })),
      tags: z.array(z.object({ tag: z.string().min(1) })),
      groups: z.array(
        z.object({
          group: z.string().min(1),
          feeds: z.array(z.object({ subreddit: z.string().min(1) })),
        })
      ),
    })
    .strict()

  t.notThrows(() => expectedDataShape.parse(userFavs))
})

test('DB::UserModel::createUserFeed', async t => {
  const subreddit = textWithPrefix(t.context.dataPrefix, `aww`)

  await UserModel.createUserFeed({ subreddit, userOwnerId: t.context.user1._id })

  const foundUserFeed = await FeedModel.findOne({ userOwnerId: t.context.user1._id, subreddit }).lean().exec()

  const expectedDataShape = z
    .object({
      _id: z.instanceof(FeedModel.base.Types.ObjectId),
      userOwnerId: z.literal(t.context.user1._id),
      subreddit: z.literal(subreddit),
      lastUpdated: z.literal(0),
      favourited: z.boolean(),
      groups: z.array(z.undefined()).optional(),
      __v: z.number(),
    })
    .strict()

  t.notThrows(() => expectedDataShape.parse(foundUserFeed))
})

test('DB::UserModel::createUserFeed::no duplicates', async t => {
  const subreddit = textWithPrefix(t.context.dataPrefix, `aww`)
  const sameSubredditDiffCasing = textWithPrefix(t.context.dataPrefix, `Aww`)

  await Promise.all([
    UserModel.createUserFeed({ subreddit, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeed({ subreddit, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeed({ subreddit: sameSubredditDiffCasing, userOwnerId: t.context.user1._id }),
  ])

  const foundUserFeeds = await FeedModel.find({
    subreddit: { $regex: `^${subreddit}$`, $options: 'i' },
    userOwnerId: t.context.user1._id,
  })
    .lean()
    .exec()

  t.true(foundUserFeeds.length === 1)
})

test('DB::UserModel::removeUserFeed', async t => {
  const subreddit = textWithPrefix(t.context.dataPrefix, `cats`)

  await UserModel.removeUserFeed({ subreddit, userOwnerId: t.context.user1._id })

  const posts = await PostModel.find({ postId: { $regex: `^${t.context.dataPrefix}` } })
    .lean()
    .exec()
  const userFeeds = await FeedModel.find({ subreddit, userOwnerId: t.context.user1._id }).lean().exec()

  t.true(posts.length === 150)
  t.true(userFeeds.length === 0)
})

test('DB::UserModel::removeUserFeed::anotherUserHasFeedWithSameSubreddit', async t => {
  const subreddit = textWithPrefix(t.context.dataPrefix, `aww`)

  await UserModel.removeUserFeed({ subreddit, userOwnerId: t.context.user1._id })

  const posts = await PostModel.find({ postId: { $regex: `^${t.context.dataPrefix}` } })
    .lean()
    .exec()
  const lookingForTheFeedWeDeleted = await FeedModel.find({
    subreddit,
    userOwnerId: t.context.user1._id,
  })
    .lean()
    .exec()
  const userFeeds = await FeedModel.find({ subreddit }).lean().exec()

  t.true(posts.length === 300)
  t.true(lookingForTheFeedWeDeleted.length === 0)
  t.true(userFeeds.length === 1)
})

test('DB::UserModel::createUserTag', async t => {
  const tag = textWithPrefix(t.context.dataPrefix, `hot`)

  await UserModel.createUserTag({ tag, userOwnerId: t.context.user1._id })

  const foundUserTag = await TagModel.findOne({ tag, userOwnerId: t.context.user1._id }).lean().exec()

  const expectedDataShape = z
    .object({
      _id: z.instanceof(FeedModel.base.Types.ObjectId),
      tag: z.literal(tag),
      userOwnerId: z.literal(t.context.user1._id),
      favourited: z.boolean(),
      posts: z.array(z.undefined()).length(0),
      __v: z.number(),
    })
    .strict()

  t.notThrows(() => expectedDataShape.parse(foundUserTag))
})

test('DB::UserModel::createUserTag::no duplicates', async t => {
  const tag = textWithPrefix(t.context.dataPrefix, `hot`)
  const sameTagButUppercase = textWithPrefix(t.context.dataPrefix, `HOT`)

  await Promise.all([
    UserModel.createUserTag({ tag, userOwnerId: t.context.user1._id }),
    UserModel.createUserTag({ tag, userOwnerId: t.context.user1._id }),
    UserModel.createUserTag({ tag: sameTagButUppercase, userOwnerId: t.context.user1._id }),
  ])

  const foundUserTags = await TagModel.find({
    tag: { $regex: `^${tag}$`, $options: 'i' },
    userOwnerId: t.context.user1._id,
  })
    .lean()
    .exec()

  t.true(foundUserTags.length === 1)

  const user = (await UserModel.aggregate([
    {
      $lookup: { from: 'tags', localField: 'postTags._id', foreignField: '_id', as: 'postTags' },
    },
    {
      $match: {
        _id: t.context.user1._id,
      },
    },
  ])) as (UserType & { postTags: TagType[] })[]

  t.true(user[0]!.postTags.length === 1)
})

test('DB::UserModel::removeUserTag', async t => {
  const tag = textWithPrefix(t.context.dataPrefix, `hot`)

  const randomPost = await PostModel.findOne({ postId: { $regex: `^${t.context.dataPrefix}` } })
    .lean()
    .exec()

  await UserModel.createUserTag({ tag, userOwnerId: t.context.user1._id })
  await UserModel.assignUserTagToPost({
    tag,
    userOwnerId: t.context.user1._id,
    postId: randomPost?.postId as string,
  })

  const user1 = await UserModel.findById(t.context.user1._id).populate('postTags').lean().exec()
  const post1 = (await PostModel.aggregate([
    { $lookup: { from: 'tags', localField: 'tags._id', foreignField: '_id', as: 'tags' } },
    { $match: { postId: { $regex: `^${t.context.dataPrefix}` }, 'tags.tag': { $in: [tag] } } },
  ]).then(res => res[0] as PostType)) as PostType

  t.true(user1?.postTags?.length === 1)
  // @ts-expect-error
  t.truthy(post1?.tags!.find(postTag => postTag.tag === tag))

  await UserModel.removeUserTag({ tag, userOwnerId: t.context.user1._id })

  const user2 = await UserModel.findById(t.context.user1._id).populate('postTags').lean().exec()
  const userTags = await TagModel.find({ tag, userOwnerId: t.context.user1._id }).lean().exec()
  const post2 = (await PostModel.aggregate([
    { $lookup: { from: 'tags', localField: 'tags._id', foreignField: '_id', as: 'tags' } },
    { $match: { postId: { $regex: `^${t.context.dataPrefix}` }, 'tags.tag': { $in: [tag] } } },
  ]).then(res => res[0] as PostType)) as PostType

  t.true(user2?.postTags?.length === 0)
  t.true(userTags.length === 0)
  // @ts-expect-error
  t.falsy(post2?.tags!.find(postTag => postTag.tag === tag))
})

test('DB::UserModel::createUserFeedGroup', async t => {
  const feedGroup = textWithPrefix(t.context.dataPrefix, `favorite-feeds`)

  await UserModel.createUserFeedGroup({ group: feedGroup, userOwnerId: t.context.user1._id })

  const foundUserTag = await FeedGroupModel.findOne({
    group: feedGroup,
    userOwnerId: t.context.user1._id,
  })
    .lean()
    .exec()

  const expectedDataShape = z
    .object({
      _id: z.instanceof(FeedModel.base.Types.ObjectId),
      group: z.literal(feedGroup),
      userOwnerId: z.literal(t.context.user1._id),
      favourited: z.boolean(),
      feeds: z.array(z.undefined()).length(0),
      __v: z.number(),
    })
    .strict()

  t.notThrows(() => expectedDataShape.parse(foundUserTag))
})

test('DB::UserModel::createUserFeedGroup::no duplicates', async t => {
  const feedGroup = textWithPrefix(t.context.dataPrefix, `favorite-feeds`)
  const sameFeedGroupDiffCasing = textWithPrefix(t.context.dataPrefix, `favorite-Feeds`)

  await Promise.all([
    UserModel.createUserFeedGroup({ group: feedGroup, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeedGroup({ group: feedGroup, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeedGroup({ group: sameFeedGroupDiffCasing, userOwnerId: t.context.user1._id }),
  ])

  const feedGroupRes = await FeedGroupModel.find({
    group: { $regex: `^${feedGroup}$`, $options: 'i' },
    userOwnerId: t.context.user1._id,
  })
    .lean()
    .exec()

  t.true(feedGroupRes.length === 1)

  const user = (await UserModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'feedGroups._id', foreignField: '_id', as: 'feedGroups' } },
    {
      $match: {
        _id: t.context.user1._id,
      },
    },
  ])) as (UserType & { feedGroups: FeedGroupType[] })[]

  t.true(user[0]!.feedGroups.length === 1)
})

test('DB::UserModel::removeUserFeedGroup', async t => {
  const feedGroup1 = textWithPrefix(t.context.dataPrefix, `favorite-feeds`)
  const feedGroup2 = textWithPrefix(t.context.dataPrefix, `temp-feeds`)

  await Promise.all([
    UserModel.createUserFeedGroup({ group: feedGroup1, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeedGroup({ group: feedGroup2, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeedGroup({ group: feedGroup1, userOwnerId: t.context.user2._id }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup1,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup2,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup1,
      userOwnerId: t.context.user2._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
  ])

  await UserModel.removeUserFeedGroup({ group: feedGroup1, userOwnerId: t.context.user1._id })

  // Make sure its no longer there
  const user1 = await UserModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'feedGroups._id', foreignField: '_id', as: 'feedGroups' } },
    {
      $match: {
        _id: t.context.user1._id,
        feedGroups: {
          $elemMatch: {
            group: feedGroup1,
            userOwnerId: t.context.user1._id,
          },
        },
      },
    },
  ])

  t.true(user1?.length === 0)

  // Check its not removed from the other user
  const user2 = await UserModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'feedGroups._id', foreignField: '_id', as: 'feedGroups' } },
    {
      $match: {
        _id: t.context.user2._id,
        feedGroups: {
          $elemMatch: {
            group: feedGroup1,
            userOwnerId: t.context.user2._id,
          },
        },
      },
    },
  ])

  t.true(user2?.length === 1)

  const totalFeedGroupsCount = await FeedGroupModel.count({ group: { $regex: `^${t.context.dataPrefix}` } })
  const deletedFeedGroup = await FeedGroupModel.find({ group: feedGroup1, userOwnerId: t.context.user1._id })

  t.true(totalFeedGroupsCount === 2)
  t.true(deletedFeedGroup.length === 0)

  const feed1 = await FeedModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'groups._id', foreignField: '_id', as: 'groups' } },
    {
      $match: {
        userOwnerId: t.context.user1._id,
        groups: {
          $elemMatch: {
            group: feedGroup1,
            userOwnerId: t.context.user1._id,
          },
        },
      },
    },
  ])

  const feed2 = await FeedModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'groups._id', foreignField: '_id', as: 'groups' } },
    {
      $match: {
        userOwnerId: t.context.user1._id,
        groups: {
          $elemMatch: {
            group: feedGroup2,
            userOwnerId: t.context.user1._id,
          },
        },
      },
    },
  ])
  const feed3 = await FeedModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'groups._id', foreignField: '_id', as: 'groups' } },
    {
      $match: {
        userOwnerId: t.context.user2._id,
        groups: {
          $elemMatch: {
            group: feedGroup1,
            userOwnerId: t.context.user2._id,
          },
        },
      },
    },
  ])

  t.true(feed1.length === 0)
  t.true(feed2.length === 1)
  t.true(feed3.length === 1)
})

test('DB::UserModel::usersFeedIsAssignedToFeedGroup', async t => {
  const feedGroup1 = textWithPrefix(t.context.dataPrefix, `favorite-feeds`)
  const feedGroup2 = textWithPrefix(t.context.dataPrefix, `temp-feeds`)

  await Promise.all([
    UserModel.createUserFeedGroup({ group: feedGroup1, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeedGroup({ group: feedGroup2, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeedGroup({ group: feedGroup1, userOwnerId: t.context.user2._id }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup1,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup2,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup1,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'cats'),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup1,
      userOwnerId: t.context.user2._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
  ])

  const results1 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup1,
    userOwnerId: t.context.user1._id,
    subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
  })

  const results2 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup2,
    userOwnerId: t.context.user1._id,
    subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
  })

  const results3 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup1,
    userOwnerId: t.context.user2._id,
    subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
  })

  const results4 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup2,
    userOwnerId: t.context.user1._id,
    subreddit: textWithPrefix(t.context.dataPrefix, 'cats'),
  })

  const results5 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup2,
    userOwnerId: t.context.user2._id,
    subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
  })

  const results6 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup1,
    userOwnerId: t.context.user2._id,
    subreddit: textWithPrefix(t.context.dataPrefix, 'cats'),
  })

  const results7 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup2,
    userOwnerId: t.context.user2._id,
    subreddit: textWithPrefix(t.context.dataPrefix, 'cats'),
  })

  t.true(results1)
  t.true(results2)
  t.true(results3)
  t.false(results4)
  t.false(results5)
  t.false(results6)
  t.false(results7)
})

test('DB::UserModel::assignFeedToUserFeedGroup', async t => {
  const feedGroup1 = textWithPrefix(t.context.dataPrefix, `favorite-feeds`)
  const feedGroup2 = textWithPrefix(t.context.dataPrefix, `temp-feeds`)

  await Promise.all([
    UserModel.createUserFeedGroup({ group: feedGroup1, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeedGroup({ group: feedGroup2, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeedGroup({ group: feedGroup1, userOwnerId: t.context.user2._id }),
  ])

  await Promise.all([
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup1,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup2,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup1,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'cats'),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup1,
      userOwnerId: t.context.user2._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
  ])

  const fgass1 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup1,
    userOwnerId: t.context.user1._id,
    subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
  })

  const fgass2 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup2,
    userOwnerId: t.context.user1._id,
    subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
  })

  const fgass3 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup1,
    userOwnerId: t.context.user1._id,
    subreddit: textWithPrefix(t.context.dataPrefix, `cats`),
  })

  const fgass4 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup1,
    userOwnerId: t.context.user2._id,
    subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
  })

  t.true(fgass1)
  t.true(fgass2)
  t.true(fgass3)
  t.true(fgass4)

  const feed1 = await FeedModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'groups._id', foreignField: '_id', as: 'groups' } },
    {
      $match: {
        userOwnerId: t.context.user1._id,
        subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
        $and: [
          {
            groups: {
              $elemMatch: {
                userOwnerId: t.context.user1._id,
                group: feedGroup1,
              },
            },
          },
          {
            groups: {
              $elemMatch: {
                userOwnerId: t.context.user1._id,
                group: feedGroup2,
              },
            },
          },
        ],
      },
    },
  ])

  t.true(feed1.length === 1)

  const feed2 = await FeedModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'groups._id', foreignField: '_id', as: 'groups' } },
    {
      $match: {
        userOwnerId: t.context.user1._id,
        subreddit: textWithPrefix(t.context.dataPrefix, `cats`),
        groups: {
          $elemMatch: {
            userOwnerId: t.context.user1._id,
            group: feedGroup1,
          },
        },
      },
    },
  ])

  t.true(feed2.length === 1)

  const feed3 = await FeedModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'groups._id', foreignField: '_id', as: 'groups' } },
    {
      $match: {
        userOwnerId: t.context.user2._id,
        subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
        groups: {
          $elemMatch: {
            userOwnerId: t.context.user2._id,
            group: feedGroup1,
          },
        },
      },
    },
  ])

  t.true(feed3.length === 1)

  const feed4 = await FeedModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'groups._id', foreignField: '_id', as: 'groups' } },
    {
      $match: {
        userOwnerId: t.context.user1._id,
        subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
        groups: {
          $elemMatch: {
            userOwnerId: t.context.user1._id,
            group: 'non-existand-feed-group',
          },
        },
      },
    },
  ])

  t.true(feed4.length === 0)
})

test('DB::UserModel::assignFeedToUserFeedGroup::no duplicates', async t => {
  const feedGroup = textWithPrefix(t.context.dataPrefix, `favorite-feeds`)
  const feedGroupDiffCasing = textWithPrefix(t.context.dataPrefix, `favorite-Feeds`)
  const subreddit = textWithPrefix(t.context.dataPrefix, 'aww')
  const subredditDiffCasing = textWithPrefix(t.context.dataPrefix, 'Aww')

  await UserModel.createUserFeed({ subreddit, userOwnerId: t.context.user1._id })

  await Promise.all([
    UserModel.createUserFeedGroup({ group: feedGroup, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeedGroup({ group: feedGroupDiffCasing, userOwnerId: t.context.user1._id }),
  ])

  await Promise.all([
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup,
      userOwnerId: t.context.user1._id,
      subreddit,
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup,
      userOwnerId: t.context.user1._id,
      subreddit,
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup,
      userOwnerId: t.context.user1._id,
      subreddit: subredditDiffCasing,
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroupDiffCasing,
      userOwnerId: t.context.user1._id,
      subreddit,
    }),
  ])

  const feedGroupRes = (await FeedGroupModel.aggregate([
    { $lookup: { from: 'feeds', localField: 'feeds._id', foreignField: '_id', as: 'feeds' } },
    { $match: { group: { $regex: `^${feedGroup}$`, $options: 'i' }, userOwnerId: t.context.user1._id } },
  ])) as (FeedGroupType & { feeds: FeedType[] })[]

  t.true(feedGroupRes[0]!.feeds.length === 1)

  const feed1 = (await FeedModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'groups._id', foreignField: '_id', as: 'groups' } },
    { $match: { userOwnerId: t.context.user1._id, subreddit: { $regex: `^${subreddit}$`, $options: 'i' } } },
  ])) as (FeedType & { groups: FeedGroupType[] })[]

  t.true(feed1[0]!.groups.length === 1)
})

test('DB::UserModel::removeFeedFromUserFeedGroup', async t => {
  const feedGroup1 = textWithPrefix(t.context.dataPrefix, `favorite-feeds`)
  const feedGroup2 = textWithPrefix(t.context.dataPrefix, `temp-feeds`)

  await Promise.all([
    UserModel.createUserFeedGroup({ group: feedGroup1, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeedGroup({ group: feedGroup2, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeedGroup({ group: feedGroup1, userOwnerId: t.context.user2._id }),
  ])

  await Promise.all([
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup1,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup2,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup1,
      userOwnerId: t.context.user1._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'cats'),
    }),
    UserModel.assignFeedToUserFeedGroup({
      group: feedGroup1,
      userOwnerId: t.context.user2._id,
      subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
    }),
  ])

  const fgass1 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup1,
    userOwnerId: t.context.user1._id,
    subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
  })

  const fgass2 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup2,
    userOwnerId: t.context.user1._id,
    subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
  })

  const fgass3 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup1,
    userOwnerId: t.context.user1._id,
    subreddit: textWithPrefix(t.context.dataPrefix, `cats`),
  })

  const fgass4 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup1,
    userOwnerId: t.context.user2._id,
    subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
  })

  t.true(fgass1)
  t.true(fgass2)
  t.true(fgass3)
  t.true(fgass4)

  await UserModel.removeFeedFromUserFeedGroup({
    group: feedGroup1,
    userOwnerId: t.context.user1._id,
    subreddit: textWithPrefix(t.context.dataPrefix, 'aww'),
  })

  // Check its gone

  const fgass5 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup1,
    userOwnerId: t.context.user1._id,
    subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
  })

  const feed1 = await FeedModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'groups._id', foreignField: '_id', as: 'groups' } },
    {
      $match: {
        userOwnerId: t.context.user1._id,
        subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
        groups: {
          $elemMatch: {
            userOwnerId: t.context.user1._id,
            group: feedGroup1,
          },
        },
      },
    },
  ])

  t.false(fgass5)
  t.true(feed1.length === 0)

  // Check the others are still there

  const fgass6 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup2,
    userOwnerId: t.context.user1._id,
    subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
  })

  const fgass7 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup1,
    userOwnerId: t.context.user1._id,
    subreddit: textWithPrefix(t.context.dataPrefix, `cats`),
  })

  const fgass8 = await UserModel.usersFeedIsAssignedToFeedGroup({
    group: feedGroup1,
    userOwnerId: t.context.user2._id,
    subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
  })

  t.true(fgass6)
  t.true(fgass7)
  t.true(fgass8)

  const feed2 = await FeedModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'groups._id', foreignField: '_id', as: 'groups' } },
    {
      $match: {
        userOwnerId: t.context.user1._id,
        subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
        groups: {
          $not: {
            $elemMatch: {
              userOwnerId: t.context.user1._id,
              group: feedGroup1,
            },
          },
        },
      },
    },
  ])

  t.true(feed2.length === 1)

  const feed3 = await FeedModel.aggregate([
    { $lookup: { from: 'feedgroups', localField: 'groups._id', foreignField: '_id', as: 'groups' } },
    {
      $match: {
        userOwnerId: t.context.user2._id,
        subreddit: textWithPrefix(t.context.dataPrefix, `aww`),
        groups: {
          $elemMatch: {
            userOwnerId: t.context.user2._id,
            group: feedGroup1,
          },
        },
      },
    },
  ])

  t.true(feed3.length === 1)
})

test('DB::UserModel::usersTagIsAssignedToPost', async t => {
  const tag1 = textWithPrefix(t.context.dataPrefix, `hot`)
  const tag2 = textWithPrefix(t.context.dataPrefix, `cold`)

  const posts = await PostModel.find({ postId: { $regex: `^${t.context.dataPrefix}` } })
    .lean()
    .exec()

  const post1 = posts[10]!
  const post2 = posts[23]!

  await Promise.all([
    UserModel.createUserTag({ tag: tag1, userOwnerId: t.context.user1._id }),
    UserModel.createUserTag({ tag: tag2, userOwnerId: t.context.user1._id }),
    UserModel.createUserTag({ tag: tag1, userOwnerId: t.context.user2._id }),
    UserModel.assignUserTagToPost({
      tag: tag1,
      userOwnerId: t.context.user1._id,
      postId: post1.postId,
    }),
    UserModel.assignUserTagToPost({
      tag: tag2,
      userOwnerId: t.context.user1._id,
      postId: post1.postId,
    }),
    UserModel.assignUserTagToPost({
      tag: tag1,
      userOwnerId: t.context.user1._id,
      postId: post2.postId,
    }),
    UserModel.assignUserTagToPost({
      tag: tag1,
      userOwnerId: t.context.user2._id,
      postId: post1.postId,
    }),
  ])

  const results1 = await UserModel.usersTagIsAssignedToPost({
    tag: tag1,
    userOwnerId: t.context.user1._id,
    postId: post1.postId,
  })

  const results2 = await UserModel.usersTagIsAssignedToPost({
    tag: tag2,
    userOwnerId: t.context.user1._id,
    postId: post1.postId,
  })

  const results3 = await UserModel.usersTagIsAssignedToPost({
    tag: tag1,
    userOwnerId: t.context.user2._id,
    postId: post1.postId,
  })

  const results4 = await UserModel.usersTagIsAssignedToPost({
    tag: tag2,
    userOwnerId: t.context.user1._id,
    postId: post2.postId,
  })

  const results5 = await UserModel.usersTagIsAssignedToPost({
    tag: tag2,
    userOwnerId: t.context.user2._id,
    postId: post1.postId,
  })

  const results6 = await UserModel.usersTagIsAssignedToPost({
    tag: tag1,
    userOwnerId: t.context.user2._id,
    postId: post2.postId,
  })

  const results7 = await UserModel.usersTagIsAssignedToPost({
    tag: tag2,
    userOwnerId: t.context.user2._id,
    postId: post2.postId,
  })

  t.true(results1)
  t.true(results2)
  t.true(results3)
  t.false(results4)
  t.false(results5)
  t.false(results6)
  t.false(results7)
})

test('DB::UserModel::assignUserTagToPost', async t => {
  const tag1 = textWithPrefix(t.context.dataPrefix, `hot`)
  const tag2 = textWithPrefix(t.context.dataPrefix, `cold`)

  const posts = await PostModel.find({ postId: { $regex: `^${t.context.dataPrefix}` } })
    .lean()
    .exec()

  const post1 = posts[10]!
  const post2 = posts[23]!

  await Promise.all([
    UserModel.createUserTag({ tag: tag1, userOwnerId: t.context.user1._id }),
    UserModel.createUserTag({ tag: tag2, userOwnerId: t.context.user1._id }),
    UserModel.createUserTag({ tag: tag1, userOwnerId: t.context.user2._id }),
  ])

  await Promise.all([
    UserModel.assignUserTagToPost({
      tag: tag1,
      userOwnerId: t.context.user1._id,
      postId: post1.postId,
    }),
    UserModel.assignUserTagToPost({
      tag: tag2,
      userOwnerId: t.context.user1._id,
      postId: post1.postId,
    }),
    UserModel.assignUserTagToPost({
      tag: tag1,
      userOwnerId: t.context.user1._id,
      postId: post2.postId,
    }),
    UserModel.assignUserTagToPost({
      tag: tag1,
      userOwnerId: t.context.user2._id,
      postId: post1.postId,
    }),
  ])

  const utagap1 = await UserModel.usersTagIsAssignedToPost({
    tag: tag1,
    userOwnerId: t.context.user1._id,
    postId: post1.postId,
  })

  const utagap2 = await UserModel.usersTagIsAssignedToPost({
    tag: tag2,
    userOwnerId: t.context.user1._id,
    postId: post1.postId,
  })

  const utagap3 = await UserModel.usersTagIsAssignedToPost({
    tag: tag1,
    userOwnerId: t.context.user1._id,
    postId: post2.postId,
  })

  const utagap4 = await UserModel.usersTagIsAssignedToPost({
    tag: tag1,
    userOwnerId: t.context.user2._id,
    postId: post1.postId,
  })

  t.true(utagap1)
  t.true(utagap2)
  t.true(utagap3)
  t.true(utagap4)

  const postres1 = await PostModel.aggregate([
    { $lookup: { from: 'tags', localField: 'tags._id', foreignField: '_id', as: 'tags' } },
    {
      $match: {
        postId: post1.postId,
        $and: [
          {
            tags: {
              $elemMatch: {
                userOwnerId: t.context.user1._id,
                tag: tag1,
              },
            },
          },
          {
            tags: {
              $elemMatch: {
                userOwnerId: t.context.user1._id,
                tag: tag2,
              },
            },
          },
        ],
      },
    },
  ])

  t.true(postres1.length === 1)

  const postres2 = await PostModel.aggregate([
    { $lookup: { from: 'tags', localField: 'tags._id', foreignField: '_id', as: 'tags' } },
    {
      $match: {
        postId: post2.postId,
        tags: {
          $elemMatch: {
            userOwnerId: t.context.user1._id,
            tag: tag1,
          },
        },
      },
    },
  ])

  t.true(postres2.length === 1)

  const postres3 = await PostModel.aggregate([
    { $lookup: { from: 'tags', localField: 'tags._id', foreignField: '_id', as: 'tags' } },
    {
      $match: {
        postId: post1.postId,
        tags: {
          $elemMatch: {
            userOwnerId: t.context.user2._id,
            tag: tag1,
          },
        },
      },
    },
  ])

  t.true(postres3.length === 1)
})

test('DB::UserModel::assignUserTagToPost::no duplicates', async t => {
  const tag = textWithPrefix(t.context.dataPrefix, `hot`)
  const tagDiffCasing = textWithPrefix(t.context.dataPrefix, `Hot`)

  await UserModel.createUserTag({ tag, userOwnerId: t.context.user1._id })

  const posts = await PostModel.find({ postId: { $regex: `^${t.context.dataPrefix}` } })
    .lean()
    .exec()

  const post = posts[0]!

  await Promise.all([
    UserModel.assignUserTagToPost({
      tag,
      userOwnerId: t.context.user1._id,
      postId: post.postId,
    }),
    UserModel.assignUserTagToPost({
      tag,
      userOwnerId: t.context.user1._id,
      postId: post.postId,
    }),
    UserModel.assignUserTagToPost({
      tag: tagDiffCasing,
      userOwnerId: t.context.user1._id,
      postId: post.postId,
    }),
  ])

  const postModelRes = (await PostModel.aggregate([
    { $lookup: { from: 'tags', localField: 'tags._id', foreignField: '_id', as: 'tags' } },
    { $match: { postId: post.postId } },
  ])) as (PostType & { tags: TagType[] })[]

  t.true(postModelRes[0]!.tags.length === 1)

  const tagRes = (await TagModel.aggregate([
    { $lookup: { from: 'posts', localField: 'posts._id', foreignField: '_id', as: 'posts' } },
    { $match: { tag: { $regex: `^${tag}$`, $options: 'i' }, userOwnerId: t.context.user1._id } },
  ])) as (TagType & { posts: PostType[] })[]

  t.true(tagRes[0]!.posts.length === 1)
})

test('DB::UserModel::removeUserTagFromPost', async t => {
  const tag1 = textWithPrefix(t.context.dataPrefix, `hot`)
  const tag2 = textWithPrefix(t.context.dataPrefix, `cold`)

  const posts = await PostModel.find({ postId: { $regex: `^${t.context.dataPrefix}` } })
    .lean()
    .exec()

  const post1 = posts[0]!
  const post2 = posts[1]!

  await Promise.all([
    UserModel.createUserTag({ tag: tag1, userOwnerId: t.context.user1._id }),
    UserModel.createUserTag({ tag: tag2, userOwnerId: t.context.user1._id }),
    UserModel.createUserTag({ tag: tag1, userOwnerId: t.context.user2._id }),
  ])

  await Promise.all([
    UserModel.assignUserTagToPost({
      tag: tag1,
      userOwnerId: t.context.user1._id,
      postId: post1.postId,
    }),
    UserModel.assignUserTagToPost({
      tag: tag2,
      userOwnerId: t.context.user1._id,
      postId: post1.postId,
    }),
    UserModel.assignUserTagToPost({
      tag: tag1,
      userOwnerId: t.context.user1._id,
      postId: post2.postId,
    }),
    UserModel.assignUserTagToPost({
      tag: tag1,
      userOwnerId: t.context.user2._id,
      postId: post1.postId,
    }),
  ])

  const utatp1 = await UserModel.usersTagIsAssignedToPost({
    tag: tag1,
    userOwnerId: t.context.user1._id,
    postId: post1.postId,
  })

  const utatp2 = await UserModel.usersTagIsAssignedToPost({
    tag: tag2,
    userOwnerId: t.context.user1._id,
    postId: post1.postId,
  })

  const utatp3 = await UserModel.usersTagIsAssignedToPost({
    tag: tag1,
    userOwnerId: t.context.user1._id,
    postId: post2.postId,
  })

  const utatp4 = await UserModel.usersTagIsAssignedToPost({
    tag: tag1,
    userOwnerId: t.context.user2._id,
    postId: post1.postId,
  })

  t.true(utatp1)
  t.true(utatp2)
  t.true(utatp3)
  t.true(utatp4)

  await UserModel.removeUserTagFromPost({
    tag: tag1,
    userOwnerId: t.context.user1._id,
    postId: post1.postId,
  })

  // Check its gone

  const utatp5 = await UserModel.usersTagIsAssignedToPost({
    tag: tag1,
    userOwnerId: t.context.user1._id,
    postId: post1.postId,
  })

  const postres1 = await PostModel.aggregate([
    { $lookup: { from: 'tags', localField: 'tags._id', foreignField: '_id', as: 'tags' } },
    {
      $match: {
        postId: post1.postId,
        tags: { $elemMatch: { tag: tag1, userOwnerId: t.context.user1._id } },
      },
    },
  ])

  t.false(utatp5)
  t.true(postres1.length === 0)

  // Check the others are still there

  const utatp6 = await UserModel.usersTagIsAssignedToPost({
    tag: tag2,
    userOwnerId: t.context.user1._id,
    postId: post1.postId,
  })

  const utatp7 = await UserModel.usersTagIsAssignedToPost({
    tag: tag1,
    userOwnerId: t.context.user1._id,
    postId: post2.postId,
  })

  const utatp8 = await UserModel.usersTagIsAssignedToPost({
    tag: tag1,
    userOwnerId: t.context.user2._id,
    postId: post1.postId,
  })

  t.true(utatp6)
  t.true(utatp7)
  t.true(utatp8)

  const postres3 = await PostModel.aggregate([
    { $lookup: { from: 'tags', localField: 'tags._id', foreignField: '_id', as: 'tags' } },
    {
      $match: {
        postId: post1.postId,
        tags: { $elemMatch: { tag: tag2, userOwnerId: t.context.user1._id } },
      },
    },
  ])

  const postres4 = await PostModel.aggregate([
    { $lookup: { from: 'tags', localField: 'tags._id', foreignField: '_id', as: 'tags' } },
    {
      $match: {
        postId: post1.postId,
        tags: { $elemMatch: { tag: tag1, userOwnerId: t.context.user2._id } },
      },
    },
  ])

  t.true(postres3.length === 1)
  t.true(postres4.length === 1)
})

test('DB::UserModel::getAllFeedsOfUser', async t => {
  const subreddit = textWithPrefix(t.context.dataPrefix, `aww`)
  const subreddit2 = textWithPrefix(t.context.dataPrefix, `cats`)

  await Promise.all([
    UserModel.createUserFeed({ subreddit, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeed({ subreddit: subreddit2, userOwnerId: t.context.user1._id }),
    UserModel.createUserFeed({ subreddit, userOwnerId: t.context.user1._id }),
  ])

  const user1Feeds = (await UserModel.getAllFeedsOfUser({ userOwnerId: t.context.user1._id })) as FeedType[]
  const user2Feeds = (await UserModel.getAllFeedsOfUser({ userOwnerId: t.context.user2._id })) as FeedType[]

  t.true(user1Feeds.length === 2)
  t.falsy(user1Feeds.find(feed => feed.userOwnerId === t.context.user2._id))
  t.true(user2Feeds.length === 1)
  t.falsy(user2Feeds.find(feed => feed.userOwnerId === t.context.user1._id))
})
