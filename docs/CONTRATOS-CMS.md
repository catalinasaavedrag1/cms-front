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
  adapters.ts          cms-service → tipos de la UI (permisivos, best-effort)
  cms-banners.api.ts   Banners (components HERO_BANNER) → real | mock
  cms-media.api.ts     Media (/media) → real | mock
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
| Banners | ✅ real (components HERO_BANNER) → mock fallback |
| Media | ✅ real (`/media`) → mock fallback |
| Dashboard | 🟡 mock (cms-service no expone dashboard agregado) |
| Páginas, contenido, menús, campañas, SEO, auditoría, publicación, secciones, segmentos, versiones, FAQ, experimentos | 🟡 mock — la **API real ya existe** en `cms-service.api.ts`; falta refinar el adaptador de cada dominio contra el payload real y cambiar el `loader` del componente de `simulateRequest(mock)` a `cmsXxxApi.list()` |

El patrón está probado en banners/media: `withMockFallback(real→adapt, mock)`.
Conectar un dominio nuevo = escribir su adaptador + su `cms-*.api.ts` + apuntar
el `useCmsResource` del componente al servicio.

---

## 7. Gaps y refinamiento

- **Adaptadores permisivos**: `adapters.ts` completa con valores neutros los
  campos que cms-service guarda en blobs (`config`/`data`) y que la UI espera
  planos. Deben **refinarse contra payloads reales** cuando cms-service esté
  integrado (equivalente al gap #5 del contrato del BFF).
- **Dashboard**: cms-service no expone `/dashboard`. Definir uno agregado o
  componerlo en el front desde `/audit` + `/publishing/jobs`.
- **Escritura/workflow**: `cms-service.api.ts` expone lecturas y el workflow
  clave (`publish`/`unpublish`/`submit-review`). Los builders (crear/editar
  banner, página, menú…) usan hoy estado local; conectarlos a `POST/PATCH` es el
  siguiente paso por dominio.
