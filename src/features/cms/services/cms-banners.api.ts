/**
 * Banners del backoffice. En cms-service los banners son `components` de tipo
 * HERO_BANNER. Lecturas: real → mock fallback. ESCRITURAS: solo con el backend
 * configurado — si no lo está, el llamador decide qué simular (la UI avisa que
 * está en modo ejemplo). Publicar = PATCH status PUBLISHED (los components no
 * tienen workflow de aprobación como pages/contents).
 */
import { banners } from '@/features/cms/mocks'
import type { CmsBanner } from '@/features/cms/types'
import { isCmsBackendEnabled, withMockFallback } from './cms.client'
import {
  createComponent,
  duplicateComponent,
  getComponent,
  listComponents,
  updateComponent,
} from './cms-service.api'
import { componentToBanner, bannerFormToComponentPayload, type BannerFormFields } from './adapters'

const BANNER_TYPE = 'HERO_BANNER'

export const cmsBannersApi = {
  list: (): Promise<CmsBanner[]> =>
    withMockFallback(async () => {
      const page = await listComponents({ filters: { componentType: BANNER_TYPE }, pageSize: 100 })
      return page.items.map(componentToBanner)
    }, banners),

  get: (id: string): Promise<CmsBanner | undefined> =>
    withMockFallback(async () => componentToBanner(await getComponent(id)), banners.find((b) => b.id === id)),

  /** true si las escrituras van al backend real. */
  canPersist: (): boolean => isCmsBackendEnabled(),

  /** Crea el banner (queda DRAFT). Lanza CmsError si el backend falla. */
  create: async (form: BannerFormFields, imageDesktop?: string | null): Promise<CmsBanner> => {
    const created = await createComponent(bannerFormToComponentPayload(form, imageDesktop))
    return componentToBanner(created)
  },

  /** Actualiza nombre + configuración del banner. */
  update: async (id: string, form: BannerFormFields, imageDesktop?: string | null): Promise<CmsBanner> => {
    const payload = bannerFormToComponentPayload(form, imageDesktop)
    const updated = await updateComponent(id, { name: payload.name, data: payload.data })
    return componentToBanner(updated)
  },

  /** Publica (visible para el BFF → tienda). */
  publish: async (id: string): Promise<CmsBanner> => componentToBanner(await updateComponent(id, { status: 'PUBLISHED' })),

  /** Despublica sin perder el contenido. */
  unpublish: async (id: string): Promise<CmsBanner> => componentToBanner(await updateComponent(id, { status: 'UNPUBLISHED' })),

  /** Archiva. */
  archive: async (id: string): Promise<CmsBanner> => componentToBanner(await updateComponent(id, { status: 'ARCHIVED' })),

  /** Duplica (para partir de una copia). */
  duplicate: async (id: string): Promise<CmsBanner> => componentToBanner(await duplicateComponent(id)),
}
