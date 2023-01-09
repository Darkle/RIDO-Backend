import { prisma } from './prisma-instance'
import {
  getAllPosts,
  getSinglePost,
  getSinglePostWithItsFeed,
  batchAddPosts,
  getPostsThatNeedMediaToBeDownloaded,
  getPostsWhereImagesNeedToBeOptimized,
  updatePostData,
  getPostsOfFeed,
} from './db-post-methods'
import {
  addFeed,
  getAllFeeds,
  getSingleFeed,
  removeFeed,
  getFavouriteFeeds,
  getFeedsThatNeedToBeUpdated,
  updateFeedLastUpdatedTimeToNow,
  findFeed,
} from './db-feed-methods'
import { addTag, getSingleTag, getAllTags, getFavouriteTags, findTag } from './db-tag-methods'
import { getSettings, updateSettings, createDefaultSettingsIfNotExist } from './db-settings-methods'

/* eslint-disable @typescript-eslint/lines-between-class-members */

class DB {
  static readonly close = prisma.$disconnect

  static init(): Promise<void> {
    return createDefaultSettingsIfNotExist()
  }

  static readonly getSettings = getSettings
  static readonly updateSettings = updateSettings

  static readonly getAllPosts = getAllPosts
  static readonly getSinglePost = getSinglePost
  static readonly getSinglePostWithItsFeed = getSinglePostWithItsFeed
  static readonly batchAddPosts = batchAddPosts
  static readonly getPostsThatNeedMediaToBeDownloaded = getPostsThatNeedMediaToBeDownloaded
  static readonly getPostsWhereImagesNeedToBeOptimized = getPostsWhereImagesNeedToBeOptimized
  static readonly updatePostData = updatePostData
  static readonly getPostsOfFeed = getPostsOfFeed

  static readonly addFeed = addFeed
  static readonly getAllFeeds = getAllFeeds
  static readonly getSingleFeed = getSingleFeed
  static readonly removeFeed = removeFeed
  static readonly getFavouriteFeeds = getFavouriteFeeds
  static readonly getFeedsThatNeedToBeUpdated = getFeedsThatNeedToBeUpdated
  static readonly updateFeedLastUpdatedTimeToNow = updateFeedLastUpdatedTimeToNow
  static readonly findFeed = findFeed

  static readonly addTag = addTag
  static readonly getSingleTag = getSingleTag
  static readonly getAllTags = getAllTags
  static readonly getFavouriteTags = getFavouriteTags
  static readonly findTag = findTag
}

export { DB }
