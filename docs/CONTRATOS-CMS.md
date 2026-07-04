# Integración Front CMS ↔ cms-service

Cómo el **Front CMS** (este repo, backoffice de contenido) se conecta con el
**cms-service**. Documento técnico: contrato, mapeo de dominios, modo degradable
y gaps a refinar.

---

## 1. Regla de arquitectura

```
Equipo interno ─► Front CMS (este repo) ─► cms-service ─► DB CMS
```

El Front CMS habla **directo** con cms-service. **NO** pasa por el
`web-bff-service` (ese es la puerta del **front público** de ecommerce). El BFF,
por su lado, **lee** de cms-service el contenido ya publicado para armar las
páginas del cliente final:

```
Cliente final ─► Front Ecommerce ─► web-bff-service ─► cms-service (solo lectura de publicado)
```

No confundir los dos fronts: el ecommerce consume el BFF; el CMS consume
cms-service.

---

## 2. Base URL, prefijo y modos

| | Valor |
|---|---|
| Prefijo del cms-service | `api/cms` (NestJS `setGlobalPrefix`) |
| Puerto local | `3040` |
| Variable del front | `NEXT_PUBLIC_CMS_SERVICE_URL` |
| Dev (directo) | `http://localhost:3040/api/cms` |
| Prod (gateway) | `https://api.mimbral.cl/api/cms` |
| Vacía / ausente | **modo mock**: el backoffice usa `src/features/cms/mocks/` |

Igual que el front público con el BFF, la conexión es **degradable**: si
cms-service no está o falla, cada pantalla cae a los datos de ejemplo. El
backoffice se puede desarrollar sin el backend arriba.

---

## 3. Capa de integración

```
src/features/cms/services/
  cms.client.ts        Cliente HTTP único (cmsRequest) + withMockFallback + isCmsBackendEnabled
  cms-service.api.ts   Endpoints reales de cms-service (pages, contents, components,
                       menus, media, campaigns, seo, audit, publishing)
  adapters.ts          cms-service → tipos de la UI (permisivos; mapeo campo a
                       campo documentado en §6b)
  cms-banners.api.ts   Banners (components HERO_BANNER) → real | mock
  cms-media.api.ts     Media (/media) → real | mock
  cms-landings.api.ts  Landing pages (/pages pageType=LANDING) → real | mock
  cms-campaigns.api.ts Campañas (/campaigns) → real | mock
  cms-menus.api.ts     Menús (/menus; code→ubicación) → real | mock
  cms-audit.api.ts     Auditoría (/audit, orden desc) → real | mock
  cms-dashboard.api.ts Overview (mock: cms-service no expone dashboard)
  simulate.ts          Mock async para dominios aún sin backend
```

Ningún componente hace `fetch` a mano: usan los servicios de dominio (directo o
vía `useCmsResource`).

---

## 4. Autenticación (modelo Janis / api-gateway)

cms-service confía en headers que inyecta el api-gateway tras autenticar:

| Header | Valor que envía el Front CMS |
|---|---|
| `x-user-id` | `NEXT_PUBLIC_CMS_ADMIN_USER_ID` (def. `cms-web`) |
| `x-client` | `NEXT_PUBLIC_CMS_CLIENT` (def. `cms-web`) |
| `x-user-permissions` | `NEXT_PUBLIC_CMS_ADMIN_PERMISSIONS` (def. `*`) |

En dev directo, si no llegan permisos cms-service asume `*` (`GatewayUserGuard`).
En prod, el gateway los inyecta y estos valores del front pasan a ser
irrelevantes (el edge los sobreescribe). Paginación por headers `x-janis-page` /
`x-janis-page-size`.

### Decisión de arquitectura — flujo de identidad del CMS (cerrada)

```
Usuario interno ─► Front CMS ─► id-service (POST /api/idservice/auth/login) → JWT
Front CMS ─► cms-service (con el JWT + headers de gateway)
```

- **id-service es el emisor de identidad de la plataforma** (usuarios, roles,
  permisos): define *quién eres*. `comerce-service` define *dónde operas*
  (empresa, canal, tienda). Ninguno reemplaza al otro.
- **cms-service NO valida tokens por sí mismo**: confía en los headers que
  inyecta el api-gateway tras autenticar contra id-service (`x-user-id`,
  `x-user-permissions`). Este es el modelo de TODO el monorepo (servicios
  internos gateway-fronted); cambiarlo solo en cms-service crearía una
  inconsistencia. **Requisito de producción**: cms-service nunca expuesto
  directo a internet — siempre detrás del gateway.
- Validaciones de permisos finos (p. ej. `cms.banner.create`,
  `cms.page.publish`, publicar por sales-channel) viven en los decoradores
  `@Permissions(...)` de cms-service y se alimentan de `x-user-permissions`.
  Con el gateway integrado a id-service, esos permisos son los reales del
  usuario; en dev directo son `*`.

---

## 5. Contrato de cms-service

**Listados** (paginados):
```json
{ "items": [ /* … */ ], "total": 120, "page": 1, "pageSize": 20 }
```

**Errores**:
```json
{ "statusCode": 404, "error": "…", "timestamp": "2026-07-03T…Z" }
```
(cms-service **no** envuelve las respuestas OK: devuelve el DTO/paginado crudo.)

### Endpoints por dominio

| Dominio UI | cms-service | Notas |
|---|---|---|
| Páginas / landings | `GET/POST /pages`, `/pages/:id`, `/pages/by-slug`, workflow (`submit-review`, `approve`, `reject`, `publish`, `unpublish`, `archive`, `rollback/:versionId`, `:id/versions`) | `PageType`: HOME, LANDING, CATEGORY, BRAND, … |
| Bloques / contenido | `GET/POST /contents`, `/contents/:id`, versiones y workflow | `ContentType`: ARTICLE, GUIDE, STATIC, BLOCK |
| Banners / carruseles / secciones | `GET/POST /components`, `/components/:id`, `/duplicate`, `/preview-data` | `ComponentType`: HERO_BANNER, BANNER_GRID, PRODUCT_CAROUSEL, … |
| Menús / mega-menú | `GET/POST /menus`, `/menus/by-code/:code`, items | |
| Media | `GET /media`, `POST /media/upload-url`, `/confirm-upload`, `PATCH/DELETE /media/:id` | |
| Campañas | `GET/POST /campaigns`, `/campaigns/:id`, `/contents` | |
| SEO | `GET /seo`, `/seo/:entityType/:entityId`, `PUT`, `POST /seo/validate` | |
| Auditoría | `GET /audit`, `/audit/history/:entityType/:entityId` | |
| Publicación / programación | `POST /publishing/schedule`, `GET /publishing/jobs`, `/jobs/:id` | |
| Segmentación | `GET /targeting-rules` | |
| Contenido publicado (lo lee el BFF) | `GET /public/home`, `/public/pages/by-slug`, `/public/banners`, `/public/menu/:code`, `/public/footer`, `/public/seo/:entityType/:entityId` | **el Front CMS no usa `/public`**; es para el BFF |

---

## 6. Estado del wiring

| Dominio | Estado |
|---|---|
| Banners | ✅ lecturas **y ESCRITURAS**: crear/editar (`POST/PATCH /components`), publicar/despublicar/archivar (PATCH `status`), duplicar. El placement viaja como código (`home-hero`) para que el BFF lo encuentre. Sin backend: modo ejemplo con aviso. |
| Media | ✅ real (`/media`) → mock fallback |
| Landing pages | ✅ lecturas **y ESCRITURAS**: crear/editar (`POST/PATCH /pages`) + SEO editable (`PUT /seo/LANDING/:id`) + workflow real (`publish`/`unpublish`/`archive` — el servicio valida transiciones) + duplicar. Builder cableado con carga real en edición y modo ejemplo con aviso. |
| Campañas | ✅ lecturas + **mutaciones en capa de servicio** (`create`/`update`, code derivado del nombre); falta formulario en la UI (CampaignManager no tiene editor aún). |
| Menús | ✅ lecturas + **mutaciones en capa de servicio** (`create`/`rename` + CRUD de items del árbol); el MegaMenuBuilder actual es demo estática — cablearlo cuando tenga estado editable. |
| Auditoría | ✅ real (`/audit`) → mock fallback |
| Dashboard | 🟡 mock (cms-service no expone dashboard agregado) |
| Contenido, SEO, publicación, secciones, segmentos, versiones, FAQ, experimentos | 🟡 mock — la **API real ya existe** en `cms-service.api.ts`; conectar cada dominio es mecánico (adaptador + cambiar el `loader` de `simulateRequest(mock)` a `cmsXxxApi.list()`) |

El patrón está probado en banners/media: `withMockFallback(real→adapt, mock)`.
Conectar un dominio nuevo = escribir su adaptador + su `cms-*.api.ts` + apuntar
el `useCmsResource` del componente al servicio.

---

## 6b. Mapeo de campos por dominio (adaptadores)

Cada dominio cableado tiene un adaptador en `services/adapters.ts` que traduce
la entidad de cms-service al tipo de la UI. Tabla por dominio: **campo de la
UI ← campo de cms-service**, qué significa (en simple) y con qué se conecta.
Los campos sin fuente conocida se completan con valores neutros (a refinar
contra payloads reales).

### Banner (`componentToBanner`) — `components` tipo HERO_BANNER

| Campo UI | ← cms-service | En simple | Se conecta con |
|---|---|---|---|
| `id` / `internalName` | `id` / `name` | Identificador y nombre interno del banner. | El BFF lo reexpone al ecommerce (`BffBanner`). |
| `title`, `subtitle`, `cta`, `link` | `config.title/subtitle/cta/link` | Lo que se lee en el banner y a dónde lleva. | Carrusel de la home del ecommerce. |
| `imageDesktop/Mobile/Tablet`, `alt` | `config.imageDesktop/…/alt` | Las imágenes por dispositivo y su texto alternativo. | Media library (URLs). |
| `placement` | `config.placement` | En qué lugar de la tienda va (`home-hero`, `category-<slug>`). | El BFF pide banners por placement. |
| `channel` / `device` | `config.channel` ó `salesChannel` / `config.device` | A qué público y dispositivo se muestra. | Segmentación B2C/B2B. |
| `priority` / `startAt` / `endAt` | `config.priority/startAt/endAt` | Orden y ventana de vigencia. | Orden del carrusel; programación. |
| `status` / `version` | `status` (normalizado a minúsculas) / `version` | Si está al aire y qué versión es. | Flujo editorial (publish/rollback). |
| `clicks` / `impressions` | `config.clicks/impressions` | Métricas de rendimiento (si existen). | Panel de performance. |

### Media (`toMediaAsset`) — `/media`

| Campo UI | ← cms-service | En simple | Se conecta con |
|---|---|---|---|
| `name` / `url` | `fileName ?? name` / `url` | Nombre del archivo y dónde vive. | Banners/bloques que lo usan. |
| `format` | `format ?? mimeType` (normalizado a JPG/PNG/WEBP/SVG/GIF/MP4) | Tipo de archivo. | Validaciones de subida. |
| `weightKb` / `dimensions` / `alt` / `tags` / `folder` | homónimos | Peso, tamaño, texto alternativo, etiquetas y carpeta. | Búsqueda en la biblioteca. |
| `usedIn` | `usedIn` | En qué piezas se está usando. | Evita borrar imágenes en uso. |
| `status` | `status` (`active/orphan/expired`) | Activo, huérfano (nadie lo usa) o vencido. | Limpieza de la biblioteca. |

### Landing page (`pageToLanding`) — `/pages` con `pageType=LANDING`

| Campo UI | ← cms-service | En simple | Se conecta con |
|---|---|---|---|
| `internalName` / `h1` / `metaTitle` | `title` (+ `h1`/`metaTitle` si existen) | Nombre interno, titular de la página y título para Google. | SEO + render de la landing. |
| `slug` / `canonicalUrl` | `slug` / `canonicalUrl` (o `/slug`) | La URL de la landing. | El ecommerce la pide como `/content/landings/:slug` vía BFF. |
| `channel` | `salesChannel` | B2C/B2B/ambos. | Contenido por canal. |
| `indexable` / `metaDescription` / `ogTitle` / `ogImage` / `schema` | homónimos (neutros si no vienen) | Lo que ve Google y las redes al compartir. | seo-service / metadata. |
| `publishAt` / `endAt` | `publishedAt` / `endAt` | Ventana de publicación. | Programación (publishing). |
| `activeVersion` / `sections` | `version` / largo de `sections[]` | Versión activa y cuántos bloques tiene. | Versionado + builder. |
| `status` / `updatedAt` / `updatedBy` | homónimos | Estado editorial y última edición. | Flujo editorial / auditoría. |

### Campaña (`toCampaign`) — `/campaigns`

| Campo UI | ← cms-service | En simple | Se conecta con |
|---|---|---|---|
| `name` / `channel` | `name` / `salesChannel` | Cómo se llama y para qué público. | Agrupa piezas por campaña. |
| `startAt` / `endAt` | `startsAt ?? startAt` / `endsAt ?? endAt` | Cuándo parte y termina. | Calendario de campañas. |
| `owner` / `approver` | `owner ?? createdBy` / `approver` | Quién la lidera y quién la aprueba. | Flujo de aprobación. |
| `pieces.*` | `pieces.{banners,landings,carousels,sections,faqs,seo}` (0 si no vienen) | Cuántas piezas de cada tipo agrupa. | `POST /campaigns/:id/contents`. |
| `promotionId` | `promotionId` | Promoción comercial asociada (si existe). | promotion-service (referencia). |
| `status` / `updatedAt` | homónimos | Estado y última edición. | Flujo editorial. |

### Menú (`toMenu` + `toMenuItem`) — `/menus`

| Campo UI | ← cms-service | En simple | Se conecta con |
|---|---|---|---|
| `name` | `name` | Nombre del menú. | — |
| `location` | derivado de `code` (`footer→footer`, `mega→mega`, `mobile→mobile`, resto→`header`) | Dónde vive el menú. | El BFF pide el `code` **`main`** para el mega-menú de la tienda. |
| `items[].label` / `.url` | `label` / `url` | Texto y link de cada entrada. | **El ecommerce extrae el slug de `url`** (`/categoria/:slug`) para colgar el subárbol. |
| `items[].order` | `position` | Orden dentro del nivel. | Orden visual del mega-menú. |
| `items[].visible` | `isVisible` | Oculto = no se pinta (permite preparar sin exponer). | Filtro en tienda y backoffice. |
| `items[].children[]` | `children` (recursivo) | Subcategorías y sub-subcategorías. | Los 3 niveles del flyout. |
| `itemCount` | calculado (conteo recursivo) | Cuántas entradas tiene en total. | Vista de lista del backoffice. |

### Auditoría (`toAuditLog`) — `/audit`

| Campo UI | ← cms-service | En simple | Se conecta con |
|---|---|---|---|
| `user` | `user ?? userId ?? createdBy` | Quién hizo el cambio. | id-service (identidad). |
| `action` | `action` | Qué hizo (crear, publicar, rechazar…). | Flujo editorial. |
| `entityType` / `entityName` | `entityType` / `entityName ?? entityId` | Sobre qué pieza. | `GET /audit/history/:entityType/:entityId`. |
| `before` / `after` | homónimos | El antes y el después del cambio. | Diffs / rollback. |
| `at` | `createdAt ?? timestamp ?? at` | Cuándo. | Orden del libro de novedades. |

> Regla común de todos los adaptadores: `status` de cms-service llega en
> MAYÚSCULAS y se normaliza a minúsculas para los badges de la UI; cualquier
> valor desconocido cae a `draft` (nunca rompe el render).

---

## 7. Gaps y refinamiento

- **Adaptadores permisivos**: `adapters.ts` completa con valores neutros los
  campos que cms-service guarda en blobs (`config`/`data`) y que la UI espera
  planos. Deben **refinarse contra payloads reales** cuando cms-service esté
  integrado (equivalente al gap #5 del contrato del BFF).
- **Dashboard**: cms-service no expone `/dashboard`. Definir uno agregado o
  componerlo en el front desde `/audit` + `/publishing/jobs`.
- **Escritura/workflow**: ✅ **banners es el piloto completo** (crear/editar/
  publicar/archivar/duplicar reales, con carga del banner real en modo edición
  y degradación a "modo ejemplo" con aviso). El patrón para el resto de
  builders (menús, landings, campañas): adaptador inverso en `adapters.ts` +
  mutaciones en su `cms-*.api.ts` + cablear los botones del builder con
  `canPersist()`/toasts, igual que `BannerEditor`. Los `components` no tienen
  workflow de aprobación (publicar = PATCH status); pages/contents sí
  (`submit-review`/`approve`/`publish`, ya expuestos).
