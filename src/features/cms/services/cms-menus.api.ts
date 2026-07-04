/**
 * Menús: `/menus` de cms-service (header, footer, mega, mobile).
 */
import { menus } from '@/features/cms/mocks'
import type { CmsMenu } from '@/features/cms/types'
import { withMockFallback } from './cms.client'
import { listMenus } from './cms-service.api'
import { toMenu } from './adapters'

export const cmsMenusApi = {
  list: (): Promise<CmsMenu[]> =>
    withMockFallback(async () => {
      const page = await listMenus({ pageSize: 50 })
      return page.items.map(toMenu)
    }, menus),
}
