/**
 * Campañas: `/campaigns` de cms-service. Real → adaptado; mock ante fallo.
 */
import { campaigns } from '@/features/cms/mocks'
import type { CmsCampaign } from '@/features/cms/types'
import { withMockFallback } from './cms.client'
import { listCampaigns, getCampaign } from './cms-service.api'
import { toCampaign } from './adapters'

export const cmsCampaignsApi = {
  list: (): Promise<CmsCampaign[]> =>
    withMockFallback(async () => {
      const page = await listCampaigns({ pageSize: 100 })
      return page.items.map(toCampaign)
    }, campaigns),

  get: (id: string): Promise<CmsCampaign | undefined> =>
    withMockFallback(async () => toCampaign(await getCampaign(id)), campaigns.find((c) => c.id === id)),
}
