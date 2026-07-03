/**
 * Adaptadores cms-service → tipos de la UI del Front CMS.
 *
 * Son **permisivos y best-effort**: cms-service organiza el contenido por
 * páginas/contenidos/componentes con la config en blobs, mientras la UI usa
 * tipos planos y ricos (`CmsBanner`, `CmsMediaAsset`, …). Estos adaptadores
 * extraen los campos comunes y completan el resto con valores neutros para que
 * la UI nunca se rompa. Deben **refinarse contra los payloads reales** cuando
 * cms-service esté integrado (ver docs/CONTRATOS-CMS.md → "Gaps y refinamiento").
 */
import type { CmsBanner, CmsChannel, CmsDevice, CmsMediaAsset, CmsStatus, MediaFormat } from '@/features/cms/types'
import type { CmsSvcEntity } from './cms-service.api'

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}
function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback
}

/** Normaliza el status de cms-service (MAYÚSCULAS) al de la UI (minúsculas). */
function toStatus(v: unknown): CmsStatus {
  const s = str(v).toLowerCase()
  const allowed: CmsStatus[] = [
    'draft', 'in_review', 'changes_requested', 'approved', 'scheduled',
    'published', 'unpublished', 'inactive', 'archived', 'expired', 'error',
  ]
  return (allowed as string[]).includes(s) ? (s as CmsStatus) : 'draft'
}

function toChannel(v: unknown): CmsChannel {
  const s = str(v).toLowerCase()
  return s === 'b2b' || s === 'both' ? (s as CmsChannel) : 'b2c'
}

function toDevice(v: unknown): CmsDevice {
  const s = str(v).toLowerCase()
  return s === 'mobile' || s === 'tablet' ? (s as CmsDevice) : 'desktop'
}

/** Componente de cms-service (HERO_BANNER / BANNER_GRID) → CmsBanner de la UI. */
export function componentToBanner(e: CmsSvcEntity): CmsBanner {
  const cfg = (e.config ?? e.data ?? {}) as Record<string, unknown>
  return {
    id: e.id,
    internalName: str(e.name ?? cfg.internalName, e.id),
    title: str(cfg.title ?? e.title),
    subtitle: str(cfg.subtitle),
    cta: str(cfg.cta),
    link: str(cfg.link),
    imageDesktop: str(cfg.imageDesktop ?? cfg.image),
    imageMobile: str(cfg.imageMobile),
    imageTablet: str(cfg.imageTablet),
    alt: str(cfg.alt),
    placement: str(cfg.placement),
    channel: toChannel(cfg.channel ?? e.salesChannel),
    device: toDevice(cfg.device),
    segmentIds: Array.isArray(cfg.segmentIds) ? (cfg.segmentIds as string[]) : [],
    branch: str(cfg.branch),
    priority: num(cfg.priority),
    startAt: str(cfg.startAt),
    endAt: str(cfg.endAt),
    utm: str(cfg.utm),
    analyticsEvent: str(cfg.analyticsEvent),
    status: toStatus(e.status),
    version: num(e.version, 1),
    clicks: num(cfg.clicks),
    impressions: num(cfg.impressions),
    updatedAt: str(e.updatedAt),
    updatedBy: str(e.updatedBy, 'system'),
  }
}

/** Media de cms-service → CmsMediaAsset de la UI. */
export function toMediaAsset(e: CmsSvcEntity): CmsMediaAsset {
  const fmt = str(e.format ?? e.mimeType).toUpperCase().replace('IMAGE/', '').replace('VIDEO/', '').replace('JPEG', 'JPG')
  const format: MediaFormat = (['JPG', 'PNG', 'WEBP', 'SVG', 'GIF', 'MP4'] as string[]).includes(fmt)
    ? (fmt as MediaFormat)
    : 'JPG'
  return {
    id: e.id,
    name: str(e.fileName ?? e.name, e.id),
    url: str(e.url),
    format,
    weightKb: num(e.weightKb ?? e.sizeKb),
    dimensions: str(e.dimensions),
    alt: str(e.alt),
    tags: Array.isArray(e.tags) ? (e.tags as string[]) : [],
    folder: str(e.folder, '/'),
    usedIn: Array.isArray(e.usedIn) ? (e.usedIn as string[]) : [],
    uploadedAt: str(e.uploadedAt ?? e.updatedAt),
    uploadedBy: str(e.uploadedBy ?? e.updatedBy, 'system'),
    status: (['active', 'orphan', 'expired'] as string[]).includes(str(e.status).toLowerCase())
      ? (str(e.status).toLowerCase() as CmsMediaAsset['status'])
      : 'active',
  }
}
