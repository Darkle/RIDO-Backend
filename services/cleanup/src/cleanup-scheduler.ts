import type { SettingsSansId } from '@services/api/src/Entities/Settings'
import { apiRPCClient, apiSubscriptions } from './utils'
// import { Logger } from './logger'

apiSubscriptions.addEventListener('settings-update', (messageData: MessageEvent<string>) => {
  if (messageData.type !== 'settings-update') return

  const adminSettings = JSON.parse(messageData.data) as SettingsSansId

  console.log('adminSettings', adminSettings)
})

apiRPCClient.healthcheck
  .query()
  .then(res => {
    console.log(`res from healthcheck:`, res)
  })
  // .then(
  //   () =>
  //     apiRPCClient.settings.update.mutate({
  //       numberMediaDownloadsAtOnce: 43,
  //       numberImagesProcessAtOnce: 55,
  //     })
  //   // Logger.error('this is an error from the cleanup service', new Error('this is an error from the cleanup service'), { meta: { thing: 3 } })
  // )
  .catch(err => {
    console.error(err)
  })
