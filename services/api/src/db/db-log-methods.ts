import type { Log, Prisma } from '@prisma/client'

import { prisma } from './prisma-instance'
import type { Jsonifiable } from 'type-fest'

type LogSearchResults = { readonly count: number; readonly results: readonly Log[] }

type IncomingLog = Pick<Log, 'level'> &
  Partial<Pick<Log, 'message' | 'error' | 'service'>> & {
    readonly other?: Jsonifiable
  }

async function saveLog(log: IncomingLog): Promise<void> {
  const otherAsStr = log.other ? JSON.stringify(log.other) : undefined

  await prisma.log.create({ data: { ...log, other: otherAsStr } })
}

function getAllLogs_Paginated(page: number, limit: number): Promise<LogSearchResults> {
  const skip = page === 1 ? 0 : (page - 1) * limit

  return prisma
    .$transaction([
      prisma.log.count(),
      prisma.log.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ])
    .then(([count, results]) => ({ count, results }))
}

// eslint-disable-next-line max-lines-per-function
function findLogs_AllLevels_WithSearch_Paginated(
  page: number,
  limit: number,
  searchQuery: string
): Promise<LogSearchResults> {
  const skip = page === 1 ? 0 : (page - 1) * limit
  const sq = searchQuery.toLowerCase()
  const searchCaseSensitivity = 'insensitive' as Prisma.QueryMode

  const whereClause = {
    OR: [
      { message: { contains: sq, mode: searchCaseSensitivity } },
      { service: { contains: sq, mode: searchCaseSensitivity } },
      { error: { contains: sq, mode: searchCaseSensitivity } },
      { other: { contains: sq, mode: searchCaseSensitivity } },
    ],
  }

  return prisma
    .$transaction([
      prisma.log.count({ where: whereClause }),
      prisma.log.findMany({ where: whereClause, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ])
    .then(([count, results]) => ({ count, results }))
}

function findLogs_LevelFilter_NoSearch_Paginated(
  page: number,
  limit: number,
  logLevel: Log['level']
): Promise<LogSearchResults> {
  const skip = page === 1 ? 0 : (page - 1) * limit

  return prisma
    .$transaction([
      prisma.log.count({ where: { level: logLevel } }),
      prisma.log.findMany({ where: { level: logLevel }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ])
    .then(([count, results]) => ({ count, results }))
}

// eslint-disable-next-line max-lines-per-function
function findLogs_LevelFilter_WithSearch_Paginated(
  page: number,
  limit: number,
  searchQuery: string,
  logLevel: Log['level']
): Promise<LogSearchResults> {
  const skip = page === 1 ? 0 : (page - 1) * limit
  const sq = searchQuery.toLowerCase()
  const searchCaseSensitivity = 'insensitive' as Prisma.QueryMode

  const whereClause = {
    OR: [
      { message: { contains: sq, mode: searchCaseSensitivity } },
      { service: { contains: sq, mode: searchCaseSensitivity } },
      { error: { contains: sq, mode: searchCaseSensitivity } },
      { other: { contains: sq, mode: searchCaseSensitivity } },
      { AND: { level: logLevel } },
    ],
  }

  return prisma
    .$transaction([
      prisma.log.count({ where: whereClause }),
      prisma.log.findMany({ where: whereClause, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ])
    .then(([count, results]) => ({ count, results }))
}

export {
  saveLog,
  getAllLogs_Paginated,
  findLogs_AllLevels_WithSearch_Paginated,
  findLogs_LevelFilter_NoSearch_Paginated,
  findLogs_LevelFilter_WithSearch_Paginated,
}
