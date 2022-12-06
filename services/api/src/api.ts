import { initStaticFileServer } from './static-file-server'
import { thing } from './db'

initStaticFileServer()

thing()
  .then(() => {
    console.log('completed db thing')
  })
  .catch(err => console.error(err))

export {}
