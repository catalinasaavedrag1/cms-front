/**
 * Landing pages del backoffice: en cms-service son `/pages` con
 * pageType=LANDING. Lecturas: real → mock. ESCRITURAS reales (crear/editar +
 * workflow publish/unpublish/archive de pages) con SEO editable vía /seo
 * (entidad LANDING). Sin backend: modo ejemplo con aviso en la UI.
 */
import { landings } from '@/features/cms/mocks'
import type { CmsLandingPage } from '@/features/cms/types'
import { isCmsBackendEnabled, withMockFallback } from './cms.client'
import {
  archiveResource,
  createPage,
  getPage,
  listPages,
  publish,
  unpublish,
  updatePage,
  upsertSeo,
} from './cms-service.api'
import {
  landingFormToPagePayload,
  landingFormToSeoPayload,
  pageToLanding,
  type LandingFormFields,
} from './adapters'

export const cmsLandingsApi = {
  list: (): Promise<CmsLandingPage[]> =>
    withMockFallback(async () => {
      const page = await listPages({ filters: { pageType: 'LANDING' }, pageSize: 100 })
      return page.items.map(pageToLanding)
    }, landings),

  get: (id: string): Promise<CmsLandingPage | undefined> =>
    withMockFallback(async () => pageToLanding(await getPage(id)), landings.find((l) => l.id === id)),

  canPersist: (): boolean => isCmsBackendEnabled(),

  /** Crea la landing (DRAFT) y guarda su SEO editable. */
  create: async (form: LandingFormFields): Promise<CmsLandingPage> => {
    const created = await createPage(landingFormToPagePayload(form))
    await upsertSeo('LANDING', created.id, landingFormToSeoPayload(form)).catch(() => {
      /* SEO es complementario: si el módulo /seo falla, la página igual quedó creada */
    })
    return pageToLanding(created)
  },

  /** Actualiza título/slug/canal + SEO editable. */
  update: async (id: string, form: LandingFormFields): Promise<CmsLandingPage> => {
    const p = landingFormToPagePayload(form)
    const updated = await updatePage(id, { title: p.title, slug: p.slug, salesChannel: p.salesChannel })
    await upsertSeo('LANDING', id, landingFormToSeoPayload(form)).catch(() => {})
    return pageToLanding(updated)
  },

  /** Workflow real de pages (el servicio valida las transiciones permitidas). */
  publish: async (id: string): Promise<CmsLandingPage> => pageToLanding(await publish('pages', id)),
  unpublish: async (id: string): Promise<CmsLandingPage> => pageToLanding(await unpublish('pages', id)),
  archive: async (id: string): Promise<CmsLandingPage> => pageToLanding(await archiveResource('pages', id)),

  /** Duplica creando una copia en DRAFT con slug derivado. */
  duplicate: async (id: string): Promise<CmsLandingPage> => {
    const original = await getPage(id)
    const copy = await createPage({
      pageType: 'LANDING',
      title: `${String(original.title ?? 'Landing')} (copia)`,
      slug: `${String(original.slug ?? 'landing')}-copia`,
      salesChannel: (original.salesChannel as string | undefined) ?? undefined,
    })
    return pageToLanding(copy)
  },
}
