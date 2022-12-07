import { initStaticFileServer } from './static-file-server'
import { thing } from './db'

initStaticFileServer()

thing()
  .then(() => {
    console.log('completed db thing')
  })
  .catch(err => console.error(err))

// setInterval(() => {
//   console.log('hello2')
// }, 2000)

export {}
