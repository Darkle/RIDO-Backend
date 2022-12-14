const fs = require('fs')
const path = require('path')

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

const mediaDir = getEnvFilePath(process.env['MEDIA_DOWNLOADS_FOLDER'])

const mediaDirExists = fs.existsSync(mediaDir)

if (!mediaDirExists) {
  fs.mkdirSync(mediaDir, { recursive: true })
}
