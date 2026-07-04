/**
 * Auditoría: `/audit` de cms-service (quién cambió qué y cuándo).
 */
import { auditLogs } from '@/features/cms/mocks'
import type { CmsAuditLog } from '@/features/cms/types'
import { withMockFallback } from './cms.client'
import { listAudit } from './cms-service.api'
import { toAuditLog } from './adapters'

export const cmsAuditApi = {
  list: (): Promise<CmsAuditLog[]> =>
    withMockFallback(async () => {
      const page = await listAudit({ pageSize: 200, sortBy: 'createdAt', sortDirection: 'desc' })
      return page.items.map(toAuditLog)
    }, auditLogs),
}
