/**
 * Banners del backoffice. En cms-service los banners son `components` de tipo
 * HERO_BANNER / BANNER_GRID. Con el backend conectado se listan y adaptan; sin
 * él (o ante fallo) se cae a los datos de ejemplo.
 */
import { banners } from '@/features/cms/mocks'
import type { CmsBanner } from '@/features/cms/types'
import { withMockFallback } from './cms.client'
import { listComponents, getComponent } from './cms-service.api'
import { componentToBanner } from './adapters'

const BANNER_TYPE = 'HERO_BANNER'

export const cmsBannersApi = {
  list: (): Promise<CmsBanner[]> =>
    withMockFallback(async () => {
      const page = await listComponents({ filters: { componentType: BANNER_TYPE }, pageSize: 100 })
      return page.items.map(componentToBanner)
    }, banners),

  get: (id: string): Promise<CmsBanner | undefined> =>
    withMockFallback(async () => componentToBanner(await getComponent(id)), banners.find((b) => b.id === id)),
}
