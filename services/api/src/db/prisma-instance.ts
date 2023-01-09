import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  // https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/logging#the-log-option
  log: process.env['LOG_ALL_DB_QUERIES'] === 'true' ? ['query', 'info', 'warn', 'error'] : undefined,
})

class PrismaInstace {
  get prisma(): typeof prisma {
    return prisma
  }
}

// This is just to stop TS from complaining that PrismaInstace is never used
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
PrismaInstace

export { prisma }
