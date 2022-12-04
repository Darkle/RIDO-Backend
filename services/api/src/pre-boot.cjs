const fs = require('fs')
const path = require('path')

const execa = require('execa')

require('dotenv-extended').load({
  path: '../../.env',
  defaults: '../../.env.defaults',
  schema: '../../.env.schema',
  errorOnMissing: true,
  errorOnRegex: true,
  assignToProcessEnv: true,
})

const isAbsolutePath = (pth = '') => pth.startsWith('/')

const rootProjectFolder = path.resolve(process.cwd(), '..', '..')

// start from project root, not sub project process cwd
const getEnvFilePath = (pth = '') => (isAbsolutePath(pth) ? pth : path.join(rootProjectFolder, pth))

const dbDir = getEnvFilePath(process.env['DATA_FOLDER'])

const dbDirExists = fs.existsSync(dbDir)

if (!dbDirExists) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const loggingDBPath = path.join(dbDir, 'logging.db')
const ridoDBPath = path.join(dbDir, 'RIDO.db')

const loggingDbInitSQLFilePath = path.join(rootProjectFolder, 'db-init-scripts', 'init-logging-db.sql')
const ridoDbInitSQLFilePath = path.join(rootProjectFolder, 'db-init-scripts', 'init-rido-db.sql')

Promise.all([
  execa('sqlite3', [loggingDBPath, `.read ${loggingDbInitSQLFilePath}`]),
  execa('sqlite3', [ridoDBPath, `.read ${ridoDbInitSQLFilePath}`]),
])
  .then(() => {
    console.log(`RIDO DB's initialized`)
  })
  .catch(err => {
    console.error(err)
  })

// NOTE: The downloads service pre-boot script creates the media downloads folder
