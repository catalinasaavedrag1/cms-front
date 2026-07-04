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
import type { CmsAuditLog, CmsBanner, CmsCampaign, CmsChannel, CmsDevice, CmsLandingPage, CmsMediaAsset, CmsMenu, CmsMenuItem, CmsStatus, MediaFormat } from '@/features/cms/types'
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

/** Página LANDING de cms-service → CmsLandingPage de la UI. */
export function pageToLanding(e: CmsSvcEntity): CmsLandingPage {
  const sections = Array.isArray(e.sections) ? (e.sections as unknown[]).length : num(e.sectionsCount)
  return {
    id: e.id,
    internalName: str(e.title ?? e.name, e.id),
    slug: str(e.slug),
    canonicalUrl: str(e.canonicalUrl, `/${str(e.slug)}`),
    channel: toChannel(e.salesChannel),
    type: 'campaign',
    indexable: e.indexable !== false,
    metaTitle: str(e.metaTitle ?? e.title),
    metaDescription: str(e.metaDescription),
    h1: str(e.h1 ?? e.title),
    ogTitle: str(e.ogTitle),
    ogImage: str(e.ogImage),
    schema: str(e.schema),
    publishAt: str(e.publishedAt ?? e.publishAt),
    endAt: str(e.endAt),
    segmentIds: Array.isArray(e.segmentIds) ? (e.segmentIds as string[]) : [],
    activeVersion: num(e.version, 1),
    sections,
    status: toStatus(e.status),
    views: num(e.views),
    conversion: num(e.conversion),
    updatedAt: str(e.updatedAt),
    updatedBy: str(e.updatedBy, 'system'),
  }
}

/** Campaña de cms-service → CmsCampaign de la UI (conteos neutros si no vienen). */
export function toCampaign(e: CmsSvcEntity): CmsCampaign {
  const pieces = (e.pieces ?? {}) as Record<string, unknown>
  return {
    id: e.id,
    name: str(e.name, e.id),
    channel: toChannel(e.salesChannel),
    startAt: str(e.startsAt ?? e.startAt),
    endAt: str(e.endsAt ?? e.endAt),
    owner: str(e.owner ?? e.createdBy, 'system'),
    approver: str(e.approver, '—'),
    status: toStatus(e.status),
    pieces: {
      banners: num(pieces.banners),
      landings: num(pieces.landings),
      carousels: num(pieces.carousels),
      sections: num(pieces.sections),
      faqs: num(pieces.faqs),
      seo: num(pieces.seo),
    },
    conflicts: num(e.conflicts),
    promotionId: str(e.promotionId) || undefined,
    updatedAt: str(e.updatedAt),
  }
}

/** Registro de auditoría de cms-service → CmsAuditLog de la UI. */
export function toAuditLog(e: CmsSvcEntity): CmsAuditLog {
  return {
    id: e.id,
    user: str(e.user ?? e.userId ?? e.createdBy, 'system'),
    action: str(e.action, '—'),
    entityType: str(e.entityType, '—'),
    entityName: str(e.entityName ?? e.entityId, '—'),
    before: str(e.before),
    after: str(e.after),
    device: str(e.device, '—'),
    at: str(e.createdAt ?? e.timestamp ?? e.at),
  }
}

function toMenuItem(raw: Record<string, unknown>, idx: number): CmsMenuItem {
  const children = Array.isArray(raw.children)
    ? (raw.children as Record<string, unknown>[]).map((c, i) => toMenuItem(c, i))
    : undefined
  return {
    id: str(raw.id, `item-${idx}`),
    label: str(raw.label, '—'),
    type: 'manual',
    url: str(raw.url),
    icon: str(raw.icon) || undefined,
    order: num(raw.position ?? raw.order, idx),
    channel: 'both',
    device: 'all' as CmsDevice,
    visible: raw.isVisible !== false,
    children,
  }
}

/** Menú de cms-service → CmsMenu de la UI. El code indica su ubicación. */
export function toMenu(e: CmsSvcEntity): CmsMenu {
  const code = str(e.code).toLowerCase()
  const location: CmsMenu['location'] =
    code.includes('footer') ? 'footer' : code.includes('mega') ? 'mega' : code.includes('mobile') ? 'mobile' : 'header'
  const items = Array.isArray(e.items)
    ? (e.items as Record<string, unknown>[]).map((i, idx) => toMenuItem(i, idx))
    : []
  const count = (list: CmsMenuItem[]): number =>
    list.reduce((n, i) => n + 1 + count(i.children ?? []), 0)
  return {
    id: e.id,
    name: str(e.name, e.id),
    location,
    channel: toChannel(e.salesChannel),
    items,
    itemCount: count(items),
    brokenLinks: 0,
    updatedAt: str(e.updatedAt),
    status: toStatus(e.status),
  }
}

/* ----------------------- Adaptadores inversos (escritura) ---------------- */

/**
 * Formulario del BannerEditor → payload de cms-service (`/components`).
 * El placement viaja como CÓDIGO (ej. "home-hero"): es lo que el BFF pide para
 * armar la tienda — si el código no calza, el banner no aparece en la web.
 */
const PLACEMENT_CODES: Record<string, string> = {
  'home · hero': 'home-hero',
  'home hero': 'home-hero',
  'home · franja': 'home-strip',
  'categoría · header': 'category-header',
}

export function placementToCode(label: string): string {
  const key = label.trim().toLowerCase()
  return (
    PLACEMENT_CODES[key] ??
    key.replace(/\s*·\s*/g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  )
}

export interface BannerFormFields {
  internalName: string
  title: string
  subtitle: string
  cta: string
  link: string
  placement: string
  channel: CmsChannel
  device: CmsDevice
  priority: number
  alt: string
  startAt: string
  endAt: string
}

export function bannerFormToComponentPayload(
  f: BannerFormFields,
  imageDesktop?: string | null,
): { componentType: string; name: string; data: Record<string, unknown> } {
  return {
    componentType: 'HERO_BANNER',
    name: f.internalName || f.title || 'Banner sin nombre',
    data: {
      title: f.title,
      subtitle: f.subtitle,
      cta: f.cta,
      link: f.link,
      placement: placementToCode(f.placement),
      channel: f.channel,
      device: f.device,
      priority: f.priority,
      alt: f.alt,
      startAt: f.startAt,
      endAt: f.endAt,
      ...(imageDesktop ? { imageDesktop } : {}),
    },
  }
}

/** Formulario del LandingVisualBuilder → payload de página LANDING. */
export interface LandingFormFields {
  metaTitle: string
  metaDescription: string
  h1: string
  slug: string
  canonical: string
  indexable: boolean
  ogTitle: string
  channel: CmsChannel
}

export function landingFormToPagePayload(f: LandingFormFields): {
  pageType: string
  title: string
  slug: string
  salesChannel?: string
} {
  return {
    pageType: 'LANDING',
    title: f.h1 || f.metaTitle || 'Landing sin título',
    slug: f.slug.replace(/^\/+/, '') || 'landing',
    // 'both' no existe en cms-service: se omite (aplica a todos los canales).
    salesChannel: f.channel === 'b2b' ? 'B2B' : f.channel === 'b2c' ? 'B2C' : undefined,
  }
}

/** Campos SEO del formulario → payload del módulo /seo (entidad LANDING). */
export function landingFormToSeoPayload(f: LandingFormFields): Record<string, unknown> {
  return {
    metaTitle: f.metaTitle,
    metaDescription: f.metaDescription,
    canonicalUrl: f.canonical,
    indexable: f.indexable,
    ogTitle: f.ogTitle,
  }
}

/** Slug estable para el code de una campaña ("Navidad 2026" → "navidad-2026"). */
export function toCampaignCode(name: string): string {
  return name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'campana'
}
