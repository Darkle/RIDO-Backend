const fs = require('fs')
const path = require('path')

require('dotenv-extended').load({
  path: '../../.env',
  defaults: '../../.env.defaults',
  schema: '../../.env.schema',
  errorOnMissing: true,
  errorOnRegex: true,
  assignToProcessEnv: true,
})

const isAbsolutePath = (pth = '') => pth.startsWith('/')

// start from project root, not sub project process cwd
const getEnvFilePath = (pth = '') =>
  isAbsolutePath(pth) ? pth : path.resolve(process.cwd(), '..', '..', pth)

const postsMediaFolder = getEnvFilePath(process.env['MEDIA_DOWNLOADS_FOLDER'])

const postsMediaFolderExists = fs.existsSync(postsMediaFolder)

if (!postsMediaFolderExists) {
  fs.mkdirSync(postsMediaFolder, { recursive: true })
}
