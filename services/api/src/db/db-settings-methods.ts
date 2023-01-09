import { nullable, type Maybe } from 'pratica'
import type { Settings } from '@prisma/client'
import { F } from '@mobily/ts-belt'

import { EE } from '../events'
import { prisma } from './prisma-instance'

async function getSettings(): Promise<Maybe<Settings>> {
  return prisma.settings.findFirst().then(nullable)
}

function updateSettings(setting: Partial<Settings>): Promise<void> {
  return prisma.settings.update({ where: { uniqueId: 'settings' }, data: setting }).then(updatedSettings => {
    EE.emit('settingsUpdate', updatedSettings)
  })
}

function createDefaultSettingsIfNotExist(): Promise<void> {
  return prisma.settings
    .findFirst({ where: { uniqueId: 'settings' } })
    .then(nullable)
    .then(res =>
      res.cata({
        Just: F.ignore,
        Nothing: () => prisma.settings.create({ data: {} }).then(F.ignore),
      })
    )
}

export { getSettings, updateSettings, createDefaultSettingsIfNotExist }
