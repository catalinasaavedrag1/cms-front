/**
 * Biblioteca de medios. Con el backend conectado lista `/media` de cms-service
 * y adapta; sin él (o ante fallo) cae a los datos de ejemplo.
 */
import { media } from '@/features/cms/mocks'
import type { CmsMediaAsset } from '@/features/cms/types'
import { withMockFallback } from './cms.client'
import { listMedia } from './cms-service.api'
import { toMediaAsset } from './adapters'

export const cmsMediaApi = {
  list: (): Promise<CmsMediaAsset[]> =>
    withMockFallback(async () => {
      const page = await listMedia({ pageSize: 200 })
      return page.items.map(toMediaAsset)
    }, media),
}
