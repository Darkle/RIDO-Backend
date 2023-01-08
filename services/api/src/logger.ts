/* eslint-disable @typescript-eslint/no-magic-numbers,functional/no-conditional-statement,complexity */
import errorToJson from '@stdlib/error-to-json'
import { G } from '@mobily/ts-belt'
import microtime from 'microtime'

import type { Log } from '@services/api/src/Entities/Log'
import { trpcRouterCaller } from './api'

// https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/logging#the-log-option

enum LogLevel {
  error = 0,
  warn = 1,
  info = 2,
  debug = 3,
  trace = 4,
}

type LogLevelKey = keyof typeof LogLevel
type LogLevelVal = typeof LogLevel[LogLevelKey]

const logLevelToString = {
  '0': 'error',
  '1': 'warn',
  '2': 'info',
  '3': 'debug',
  '4': 'trace',
}

type LogLevelToStringKey = keyof typeof logLevelToString

const Color = {
  Reset: '\x1b[0m',
  FgRed: '\x1b[31m',
  FgYellow: '\x1b[33m',
}

const globalLoggingLevel = (process.env['LOG_LEVEL'] || 'error').toLowerCase() as LogLevelKey

const logLevelIsNotHighEnough = (logLevel: LogLevelVal): boolean => logLevel > LogLevel[globalLoggingLevel]

class Logger {
  private static logToConsole(logLevel: LogLevelVal, logArgs: readonly unknown[]): void {
    if (logLevelIsNotHighEnough(logLevel)) return

    // Way too noisy if log trace logs
    if (logLevel === LogLevel.trace) return

    if (logLevel === LogLevel.error) {
      console.error('⛔', Color.FgRed, ...logArgs, Color.Reset)
    }
    if (logLevel === LogLevel.warn) {
      console.warn('⚠️', Color.FgYellow, ...logArgs, Color.Reset)
    }
    if (logLevel === LogLevel.info) {
      console.info(...logArgs)
    }
    if (logLevel === LogLevel.debug) {
      console.debug(...logArgs)
    }
  }

  private static logToDB(logLevel: typeof LogLevel[LogLevelKey], logArgs: readonly unknown[]): void {
    // Always allow trace logs through to be saved to db regargless of global log level
    if (logLevel !== LogLevel.trace && logLevelIsNotHighEnough(logLevel)) return

    const logLevelAsString = logLevelToString[logLevel.toString() as LogLevelToStringKey]

    // I figure you wouldnt send more than one error through
    const error = logArgs.find(G.isError)

    const message = logArgs.filter(G.isString).join(' ')

    const other = logArgs.filter((arg: unknown) => !G.isError(arg) && !G.isString(arg))

    const logPreparedForDb = {
      /*****
       Using microtime so can have more resolution. Otherwise logs that are called at the exact same time (in the same process)
        can have the exact same time if use Date.now(), which makes it hard to trace which log came first. 
      *****/
      createdAt: microtime.nowDouble(),
      level: logLevelAsString,
      service: 'api-service',
      ...(message.length ? { message } : {}),
      ...(error ? { error: JSON.stringify(errorToJson(error)) } : {}),
      ...(other.length ? { other } : {}),
    } as Log

    //NOTE: if you are copying this code, createCaller is only for use when used in the same process that the tRPC server is running.
    trpcRouterCaller.log.saveLog(logPreparedForDb).catch(err => console.error(err))
  }

  static error(...logArgs: readonly unknown[]): void {
    Logger.logToConsole(LogLevel.error, logArgs)
    Logger.logToDB(LogLevel.error, logArgs)
  }

  static warn(...logArgs: readonly unknown[]): void {
    Logger.logToConsole(LogLevel.warn, logArgs)
    Logger.logToDB(LogLevel.warn, logArgs)
  }

  static info(...logArgs: readonly unknown[]): void {
    Logger.logToConsole(LogLevel.info, logArgs)
    Logger.logToDB(LogLevel.info, logArgs)
  }

  static debug(...logArgs: readonly unknown[]): void {
    Logger.logToConsole(LogLevel.debug, logArgs)
    Logger.logToDB(LogLevel.debug, logArgs)
  }

  static trace(...logArgs: readonly unknown[]): void {
    Logger.logToConsole(LogLevel.trace, logArgs)
    Logger.logToDB(LogLevel.trace, logArgs)
  }
}

export { Logger }
