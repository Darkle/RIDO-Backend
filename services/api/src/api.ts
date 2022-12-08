import { initStaticFileServer } from './static-file-server'
import { thing } from './db'

initStaticFileServer()

thing()

// setInterval(() => {
//   console.log('hello2')
// }, 2000)

export {}
