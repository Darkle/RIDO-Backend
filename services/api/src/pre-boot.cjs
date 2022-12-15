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

const ridoDBPath = path.join(dbDir, 'RIDO.db')
/*****
  EDGEDB_SERVER_DATADIR="./data"
EDGEDB_DATABASE="RIDOdb"
*****/
try {
  // execFileSync(`edgedb instance create ${process.env['EDGEDB_DATABASE'] || 'RIDOdb'}`)
  // execFileSync(`instance start -I ${process.env['EDGEDB_DATABASE'] || 'RIDOdb'}`)
  // execFileSync(`edgedb database create ${process.env['EDGEDB_DATABASE'] || 'RIDOdb'}`)
  // execFileSync(`edgedb migrate`)
  execFileSync(
    `EDGEDB_SERVER_DATADIR="${process.env['EDGEDB_SERVER_DATADIR'] || './data'}" EDGEDB_DATABASE="${
      process.env['EDGEDB_DATABASE'] || 'RIDOdb'
    }" edgedb project init --non-interactive`
  )
} catch (error) {
  if (!error.message.includes('already exists')) {
    console.error(error)
  }
}

console.log(`RIDO DB's initialized`)
