import invariant from 'tiny-invariant'
import type { Feed } from '@prisma/client'
import { nullable, type Maybe } from 'pratica'

import { prisma } from './prisma-instance'

async function addFeed(feedName: Feed['name'], feedDomain: Feed['domain']): Promise<void> {
  invariant(feedDomain.includes('.'), 'feedDomain is not a valid domain')

  // Lowercase feed name for reddit as user may have different casing when input and dont want dupes. We dont do this for non reddit feed ids as casing would be important (eg a thread id of `pu38Fg8` where casing matters)
  const name = feedDomain === 'reddit.com' ? feedName.toLowerCase() : feedName

  // Using createMany to easily ignore duplicate
  await prisma.feed.createMany({ data: { domain: feedDomain, name }, skipDuplicates: true })
}

function getAllFeeds(): Promise<readonly Feed[]> {
  return prisma.feed.findMany()
}

function getSingleFeed(feedName: Feed['name'], feedDomain: Feed['domain']): Promise<Maybe<Feed>> {
  return prisma.feed.findFirst({ where: { name: feedName, domain: feedDomain } }).then(nullable)
}

async function removeFeed(feedName: Feed['name'], feedDomain: Feed['domain']): Promise<void> {
  await prisma.feed.delete({ where: { name_and_domain: { name: feedName, domain: feedDomain } } })
}

function getFavouriteFeeds(): Promise<readonly Feed[]> {
  return prisma.feed.findMany({ where: { favourited: true } })
}

function getFeedsThatNeedToBeUpdated(): Promise<readonly Feed[]> {
  const oneHourInMillisecs = 3_600_000
  const anHourAgo = (): number => Date.now() - oneHourInMillisecs

  return prisma.feed.findMany({ where: { updateCheck_lastUpdated: { lt: anHourAgo() } } })
}

async function updateFeedLastUpdatedTimeToNow(
  feedName: Feed['name'],
  feedDomain: Feed['domain']
): Promise<void> {
  await prisma.feed.update({
    where: { name_and_domain: { name: feedName, domain: feedDomain } },
    data: { updateCheck_lastUpdated: Date.now() },
  })
}

function findFeed(searchQuery: string): Promise<readonly Feed[]> {
  return prisma.feed.findMany({
    where: { name: { contains: searchQuery.toLowerCase(), mode: 'insensitive' } },
  })
}

export {
  addFeed,
  getAllFeeds,
  getSingleFeed,
  removeFeed,
  getFavouriteFeeds,
  getFeedsThatNeedToBeUpdated,
  updateFeedLastUpdatedTimeToNow,
  findFeed,
}
