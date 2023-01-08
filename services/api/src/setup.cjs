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

// @ts-expect-error
const dbFilePathSansFileProtocol = getEnvFilePath(process.env['DB_FILE_PATH'].replace('file:', ''))

const dbDir = path.dirname(getEnvFilePath(dbFilePathSansFileProtocol))

const mediaDir = getEnvFilePath(process.env['MEDIA_DOWNLOADS_FOLDER'])

const dbDirExists = fs.existsSync(dbDir)
const mediaDirExists = fs.existsSync(mediaDir)

if (!mediaDirExists) {
  fs.mkdirSync(mediaDir, { recursive: true })
}

if (!dbDirExists) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const ridoDbInitSQLFilePath = path.join(process.cwd(), 'init-db.sql')

execFileSync('sqlite3', [dbFilePathSansFileProtocol, `.read ${ridoDbInitSQLFilePath}`])
