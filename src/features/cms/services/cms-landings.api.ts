/**
 * Landing pages del backoffice: en cms-service son `/pages` con
 * pageType=LANDING. Real → adaptado; mock ante fallo o sin backend.
 */
import { landings } from '@/features/cms/mocks'
import type { CmsLandingPage } from '@/features/cms/types'
import { withMockFallback } from './cms.client'
import { listPages, getPage } from './cms-service.api'
import { pageToLanding } from './adapters'

export const cmsLandingsApi = {
  list: (): Promise<CmsLandingPage[]> =>
    withMockFallback(async () => {
      const page = await listPages({ filters: { pageType: 'LANDING' }, pageSize: 100 })
      return page.items.map(pageToLanding)
    }, landings),

  get: (id: string): Promise<CmsLandingPage | undefined> =>
    withMockFallback(async () => pageToLanding(await getPage(id)), landings.find((l) => l.id === id)),
}
