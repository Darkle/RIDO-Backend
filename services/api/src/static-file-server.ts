import { createServer } from 'http'

import staticServer from 'node-static'

const threeDaysInSeconds = 259200

const fileServer = new staticServer.Server(process.env['MEDIA_DOWNLOADS_FOLDER'] as string, {
  cache: threeDaysInSeconds,
})

const initStaticFileServer = (): void => {
  createServer((request, response) => {
    request
      .addListener('end', () => {
        fileServer.serve(request, response)
      })
      .resume()
  }).listen(Number(process.env['API_STATIC_FILE_SERVER_PORT']))
}

export { initStaticFileServer }
