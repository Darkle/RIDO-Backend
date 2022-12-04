require('dotenv-extended').load({
  path: '../.env',
  defaults: '../.env.defaults',
  schema: '../.env.schema',
  errorOnMissing: true,
  errorOnRegex: true,
  assignToProcessEnv: true,
})

const fs = require('fs')
const path = require('path')

const isAbsolutePath = (pth = '') => pth.startsWith('/')

// start from project root, not sub project process cwd
const getEnvFilePath = (pth = '') => (isAbsolutePath(pth) ? pth : path.resolve(process.cwd(), '..', pth))

const dbDir = getEnvFilePath(process.env['DB_FOLDER_PATH'])

const dbDirExists = fs.existsSync(dbDir)

const postsMediaFolder = getEnvFilePath(process.env['MEDIA_FOLDER_PATH'])

const postsMediaFolderExists = fs.existsSync(postsMediaFolder)

if (!postsMediaFolderExists) {
  fs.mkdirSync(postsMediaFolder, { recursive: true })
}

if (!dbDirExists) {
  fs.mkdirSync(dbDir, { recursive: true })
}
