/**
 * Endpoints reales del **cms-service** (prefijo `api/cms`), tipados de forma
 * permisiva. Estas funciones son el "qué existe" del backend; los servicios de
 * dominio (`cms-*.api.ts`) las consumen y adaptan a los tipos de la UI, con
 * degradación a mock.
 *
 * Mapeo dominio del Front CMS ↔ cms-service (ver docs/CONTRATOS-CMS.md):
 *   páginas/landings   → /pages         (PageType: HOME, LANDING, …)
 *   bloques/contenido  → /contents       (ContentType: ARTICLE, BLOCK, …)
 *   banners/carruseles → /components      (ComponentType: HERO_BANNER, PRODUCT_CAROUSEL, …)
 *   menús              → /menus
 *   media              → /media
 *   campañas           → /campaigns
 *   SEO                → /seo
 *   auditoría          → /audit
 *   publicación        → /publishing
 */
import { cmsRequest, type CmsPage } from './cms.client'

/* Tipos crudos permisivos (refinar contra payloads reales — ver CONTRATOS-CMS §gap). */
export interface CmsSvcEntity {
  id: string
  status?: string
  updatedAt?: string
  updatedBy?: string
  version?: number
  [key: string]: unknown
}

export interface ListParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  filters?: Record<string, string | undefined>
}

function listQuery(params: ListParams = {}): Record<string, string | number | undefined> {
  const q: Record<string, string | number | undefined> = {
    sortBy: params.sortBy,
    sortDirection: params.sortDirection,
  }
  // cms-service acepta filtros como objeto; se serializan como filters[campo].
  if (params.filters) {
    for (const [k, v] of Object.entries(params.filters)) {
      if (v != null) q[`filters[${k}]`] = v
    }
  }
  return q
}

/* -------------------------------- Páginas -------------------------------- */
export function listPages(params?: ListParams): Promise<CmsPage<CmsSvcEntity>> {
  return cmsRequest('/pages', { query: listQuery(params), page: params?.page, pageSize: params?.pageSize })
}
export const getPage = (id: string) => cmsRequest<CmsSvcEntity>(`/pages/${encodeURIComponent(id)}`)
export const getPageBySlug = (slug: string, locale?: string) =>
  cmsRequest<CmsSvcEntity>('/pages/by-slug', { query: { slug, locale } })
export const createPage = (payload: { pageType: string; title: string; slug: string; salesChannel?: string; campaignId?: string }) =>
  cmsRequest<CmsSvcEntity>('/pages', { method: 'POST', body: payload })
export const updatePage = (id: string, payload: { title?: string; slug?: string; salesChannel?: string; changeSummary?: string }) =>
  cmsRequest<CmsSvcEntity>(`/pages/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload })

/* ---------------------------- Contenido/bloques -------------------------- */
export function listContents(params?: ListParams): Promise<CmsPage<CmsSvcEntity>> {
  return cmsRequest('/contents', { query: listQuery(params), page: params?.page, pageSize: params?.pageSize })
}
export const getContent = (id: string) => cmsRequest<CmsSvcEntity>(`/contents/${encodeURIComponent(id)}`)

/* -------------------------- Componentes (banners) ------------------------ */
export function listComponents(params?: ListParams): Promise<CmsPage<CmsSvcEntity>> {
  return cmsRequest('/components', { query: listQuery(params), page: params?.page, pageSize: params?.pageSize })
}
export const getComponent = (id: string) => cmsRequest<CmsSvcEntity>(`/components/${encodeURIComponent(id)}`)
export const createComponent = (payload: { componentType: string; name: string; data: Record<string, unknown>; status?: string }) =>
  cmsRequest<CmsSvcEntity>('/components', { method: 'POST', body: payload })
export const updateComponent = (id: string, payload: { name?: string; data?: Record<string, unknown>; status?: string }) =>
  cmsRequest<CmsSvcEntity>(`/components/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload })
export const duplicateComponent = (id: string) =>
  cmsRequest<CmsSvcEntity>(`/components/${encodeURIComponent(id)}/duplicate`, { method: 'POST' })

/* --------------------------------- Menús --------------------------------- */
export function listMenus(params?: ListParams): Promise<CmsPage<CmsSvcEntity>> {
  return cmsRequest('/menus', { query: listQuery(params), page: params?.page, pageSize: params?.pageSize })
}
export const getMenuByCode = (code: string) => cmsRequest<CmsSvcEntity>(`/menus/by-code/${encodeURIComponent(code)}`)
export const createMenu = (payload: { code: string; name: string; salesChannel?: string; items?: unknown[] }) =>
  cmsRequest<CmsSvcEntity>('/menus', { method: 'POST', body: payload })
export const updateMenu = (id: string, payload: { name?: string; salesChannel?: string }) =>
  cmsRequest<CmsSvcEntity>(`/menus/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload })
export const addMenuItem = (menuId: string, item: { parentId?: string; label: string; url?: string; categoryId?: string; position?: number; isVisible?: boolean }) =>
  cmsRequest<CmsSvcEntity>(`/menus/${encodeURIComponent(menuId)}/items`, { method: 'POST', body: item })
export const updateMenuItem = (itemId: string, item: { label?: string; url?: string; position?: number; isVisible?: boolean }) =>
  cmsRequest<CmsSvcEntity>(`/menus/items/${encodeURIComponent(itemId)}`, { method: 'PATCH', body: item })
export const deleteMenuItem = (itemId: string) =>
  cmsRequest<void>(`/menus/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' })

/* --------------------------------- Media --------------------------------- */
export function listMedia(params?: ListParams): Promise<CmsPage<CmsSvcEntity>> {
  return cmsRequest('/media', { query: listQuery(params), page: params?.page, pageSize: params?.pageSize })
}

/* ------------------------------- Campañas -------------------------------- */
export function listCampaigns(params?: ListParams): Promise<CmsPage<CmsSvcEntity>> {
  return cmsRequest('/campaigns', { query: listQuery(params), page: params?.page, pageSize: params?.pageSize })
}
export const getCampaign = (id: string) => cmsRequest<CmsSvcEntity>(`/campaigns/${encodeURIComponent(id)}`)
export const createCampaign = (payload: { name: string; code: string; startsAt?: string; endsAt?: string; landingPageId?: string }) =>
  cmsRequest<CmsSvcEntity>('/campaigns', { method: 'POST', body: payload })
export const updateCampaign = (id: string, payload: { name?: string; startsAt?: string; endsAt?: string; status?: string }) =>
  cmsRequest<CmsSvcEntity>(`/campaigns/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload })

/* ---------------------------------- SEO ---------------------------------- */
export function listSeo(params?: ListParams): Promise<CmsPage<CmsSvcEntity>> {
  return cmsRequest('/seo', { query: listQuery(params), page: params?.page, pageSize: params?.pageSize })
}

/* ------------------------------- Auditoría ------------------------------- */
export function listAudit(params?: ListParams): Promise<CmsPage<CmsSvcEntity>> {
  return cmsRequest('/audit', { query: listQuery(params), page: params?.page, pageSize: params?.pageSize })
}

/* ------------------------------ Publicación ------------------------------ */
export function listPublishingJobs(params?: ListParams): Promise<CmsPage<CmsSvcEntity>> {
  return cmsRequest('/publishing/jobs', { query: listQuery(params), page: params?.page, pageSize: params?.pageSize })
}

/* ----------------------- Workflow de contenido/página -------------------- */
type Resource = 'contents' | 'pages'
export const publish = (resource: Resource, id: string) =>
  cmsRequest<CmsSvcEntity>(`/${resource}/${encodeURIComponent(id)}/publish`, { method: 'POST' })
export const unpublish = (resource: Resource, id: string) =>
  cmsRequest<CmsSvcEntity>(`/${resource}/${encodeURIComponent(id)}/unpublish`, { method: 'POST' })
export const submitReview = (resource: Resource, id: string) =>
  cmsRequest<CmsSvcEntity>(`/${resource}/${encodeURIComponent(id)}/submit-review`, { method: 'POST' })
export const archiveResource = (resource: Resource, id: string) =>
  cmsRequest<CmsSvcEntity>(`/${resource}/${encodeURIComponent(id)}/archive`, { method: 'POST' })

/** SEO editable por entidad (entityType: PAGE | LANDING | CATEGORY | BRAND | INSTITUTIONAL). */
export const upsertSeo = (entityType: string, entityId: string, payload: Record<string, unknown>) =>
  cmsRequest<CmsSvcEntity>(`/seo/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`, { method: 'PUT', body: payload })
