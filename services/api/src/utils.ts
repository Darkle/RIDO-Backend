import path from 'path'

import { DateTime } from 'luxon'

const isDev = (): boolean => process.env['NODE_ENV'] !== 'production'

const isAbsolutePath = (pth = ''): boolean => pth.startsWith('/')

// start from project root, not sub project process cwd
const getEnvFilePath = (pth = ''): string =>
  isAbsolutePath(pth) ? pth : path.resolve(process.cwd(), '..', '..', pth)

const isInTesting = process.env['NODE_ENV'] === 'test'

/*****
  The posts timestamp is in seconds since the epoch and is UTC 0. So we need to convert
  the date we received from the frontend from the local date to UTC 0 (aka GMT) and to
  seconds since the epoch.
*****/
const localDateToGMTEpoch = (d: Date): number => DateTime.fromJSDate(d).setZone('GMT').toSeconds()

export { isDev, getEnvFilePath, isInTesting, localDateToGMTEpoch }
