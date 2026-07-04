/**
 * Campañas: `/campaigns` de cms-service. Real → adaptado; mock ante fallo.
 */
import { campaigns } from '@/features/cms/mocks'
import type { CmsCampaign } from '@/features/cms/types'
import { withMockFallback } from './cms.client'
import { isCmsBackendEnabled } from './cms.client'
import { createCampaign, getCampaign, listCampaigns, updateCampaign } from './cms-service.api'
import { toCampaignCode } from './adapters'
import { toCampaign } from './adapters'

export const cmsCampaignsApi = {
  list: (): Promise<CmsCampaign[]> =>
    withMockFallback(async () => {
      const page = await listCampaigns({ pageSize: 100 })
      return page.items.map(toCampaign)
    }, campaigns),

  get: (id: string): Promise<CmsCampaign | undefined> =>
    withMockFallback(async () => toCampaign(await getCampaign(id)), campaigns.find((c) => c.id === id)),

  canPersist: (): boolean => isCmsBackendEnabled(),

  /** Crea la campaña (code derivado del nombre). */
  create: async (form: { name: string; startAt?: string; endAt?: string }): Promise<CmsCampaign> =>
    toCampaign(
      await createCampaign({
        name: form.name,
        code: toCampaignCode(form.name),
        startsAt: form.startAt || undefined,
        endsAt: form.endAt || undefined,
      }),
    ),

  update: async (id: string, form: { name?: string; startAt?: string; endAt?: string }): Promise<CmsCampaign> =>
    toCampaign(await updateCampaign(id, { name: form.name, startsAt: form.startAt, endsAt: form.endAt })),
}
