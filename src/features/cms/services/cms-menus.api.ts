/**
 * Menús: `/menus` de cms-service (header, footer, mega, mobile).
 */
import { menus } from '@/features/cms/mocks'
import type { CmsMenu } from '@/features/cms/types'
import { withMockFallback } from './cms.client'
import { isCmsBackendEnabled } from './cms.client'
import { addMenuItem, createMenu, deleteMenuItem, listMenus, updateMenu, updateMenuItem } from './cms-service.api'
import { toMenu } from './adapters'

export const cmsMenusApi = {
  list: (): Promise<CmsMenu[]> =>
    withMockFallback(async () => {
      const page = await listMenus({ pageSize: 50 })
      return page.items.map(toMenu)
    }, menus),

  canPersist: (): boolean => isCmsBackendEnabled(),

  /** Crea un menú (code = ubicación: main, footer, mega, mobile). */
  create: async (form: { code: string; name: string }): Promise<CmsMenu> =>
    toMenu(await createMenu({ code: form.code, name: form.name })),

  rename: async (id: string, name: string): Promise<CmsMenu> => toMenu(await updateMenu(id, { name })),

  /** Items del árbol (el mega-menú que consume la tienda vía BFF). */
  addItem: (menuId: string, item: { parentId?: string; label: string; url?: string; position?: number }) =>
    addMenuItem(menuId, item),
  updateItem: (itemId: string, item: { label?: string; url?: string; position?: number; isVisible?: boolean }) =>
    updateMenuItem(itemId, item),
  removeItem: (itemId: string) => deleteMenuItem(itemId),
}
