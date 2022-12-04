import crypto from 'crypto'

import test from 'ava'
import { z } from 'zod'

import '../../services/api/src/api'
import { LogModel } from '../../services/api/src/db/Log/Log'
import type { LogWithStaticMethods } from '../../services/api/src/db/Log/Log'
import { TraceLogModel } from '../../services/api/src/db/Log/TraceLog'
import type { TraceLogStaticMethods } from '../../services/api/src/db/Log/TraceLog'

const createDataPrefix = (): string => crypto.randomBytes(10).toString('hex')

const textWithPrefix = (dbDataPrefix: string, text: string): string => `${dbDataPrefix}-${text}`

test('DB::LogModel::createLog', async t => {
  const dataPrefix = createDataPrefix()
  const data: Parameters<LogWithStaticMethods['createLog']>[0] = {
    level: 'error',
    message: textWithPrefix(dataPrefix, 'test-abc'),
    bar: 'baz',
    merp: { derp: ['asd'] },
  }
  await LogModel.createLog(data)
  const log = await LogModel.findOne({ level: data.level, message: data.message }).lean().exec()

  const expectedDataShape = z
    .object({
      _id: z.instanceof(LogModel.base.Types.ObjectId),
      level: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']),
      message: z.literal(data.message),
      other: z.object({
        bar: z.literal('baz'),
        merp: z.object({
          derp: z.array(z.enum(['asd'])),
        }),
      }),
      createdAt: z.date(),
      expireAt: z.date(),
      __v: z.number(),
    })
    .strict()

  t.notThrows(() => expectedDataShape.parse(log))
  t.teardown(() => LogModel.deleteOne({ level: data.level, message: data.message }))
})

test('DB::TraceLogModel::createTraceLog', async t => {
  const dataPrefix = createDataPrefix()
  const data: Parameters<TraceLogStaticMethods['createTraceLog']>[0] = {
    level: 'trace',
    message: textWithPrefix(dataPrefix, 'test-trace-abc'),
    bar: 'baz',
    merp: { derp: ['asd'] },
  }
  await TraceLogModel.createTraceLog(data)
  const traceLog = await TraceLogModel.findOne({ level: data.level, message: data.message }).lean().exec()

  const expectedDataShape = z
    .object({
      _id: z.instanceof(LogModel.base.Types.ObjectId),
      level: z.literal(data.level),
      message: z.literal(data.message),
      other: z.object({
        bar: z.literal('baz'),
        merp: z.object({
          derp: z.array(z.enum(['asd'])),
        }),
      }),
      createdAt: z.date(),
      expireAt: z.date(),
      __v: z.number(),
    })
    .strict()

  t.notThrows(() => expectedDataShape.parse(traceLog))
  t.teardown(() => TraceLogModel.deleteOne({ level: data.level, message: data.message }))
})
