import type { Tag } from '@prisma/client'

import { prisma } from './prisma-instance'
import { nullable, type Maybe } from 'pratica'

async function addTag(tag: Tag['tag']): Promise<void> {
  // Using createMany to easily ignore duplicate
  await prisma.tag.createMany({ data: { tag }, skipDuplicates: true })
}

function getSingleTag(tag: Tag['tag']): Promise<Maybe<Tag>> {
  return prisma.tag.findFirst({ where: { tag } }).then(nullable)
}

function getAllTags(): Promise<readonly Tag[]> {
  return prisma.tag.findMany()
}

function getFavouriteTags(): Promise<readonly Tag[]> {
  return prisma.tag.findMany({ where: { favourited: true } })
}

function findTag(searchQuery: string): Promise<readonly Tag[]> {
  return prisma.tag.findMany({
    where: { tag: { contains: searchQuery.toLowerCase(), mode: 'insensitive' } },
  })
}

export { addTag, getSingleTag, getAllTags, getFavouriteTags, findTag }
