const fs = require('fs')
const path = require('path')
const { execFileSync } = require('node:child_process')

require('dotenv-extended').load({
  // only two levels up as the cwd is the dir the process started in
  path: '../../.env',
  defaults: '../../.env.defaults',
  schema: '../../.env.schema',
  errorOnMissing: true,
  errorOnRegex: true,
  assignToProcessEnv: true,
})

const isAbsolutePath = (pth = '') => pth.startsWith('/')

const ridoProjectRootFolder = path.resolve(process.cwd(), '..', '..')

// start from project root, not sub project process cwd
const getEnvFilePath = (pth = '') => (isAbsolutePath(pth) ? pth : path.join(ridoProjectRootFolder, pth))

const dbDir = getEnvFilePath(process.env['DATA_FOLDER'])
const mediaDir = getEnvFilePath(process.env['MEDIA_DOWNLOADS_FOLDER'])

const dbDirExists = fs.existsSync(dbDir)
const mediaDirExists = fs.existsSync(mediaDir)

if (!mediaDirExists) {
  fs.mkdirSync(mediaDir, { recursive: true })
}

if (!dbDirExists) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const loggingDBPath = path.join(dbDir, 'RIDO-logs.db')
const ridoDBPath = path.join(dbDir, 'RIDO.db')

const loggingDbInitSQLFilePath = path.join(ridoProjectRootFolder, 'db-init-scripts', 'init-logging-db.sql')
const ridoDbInitSQLFilePath = path.join(ridoProjectRootFolder, 'db-init-scripts', 'init-rido-db.sql')

execFileSync('sqlite3', [loggingDBPath, `.read ${loggingDbInitSQLFilePath}`])
execFileSync('sqlite3', [ridoDBPath, `.read ${ridoDbInitSQLFilePath}`])

console.log(`RIDO DB's initialized`)
