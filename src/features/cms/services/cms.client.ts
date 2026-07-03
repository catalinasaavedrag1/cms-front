/**
 * Cliente HTTP único hacia el **cms-service** (backoffice de contenido).
 *
 * REGLA DE ARQUITECTURA: el Front CMS habla **directo** con cms-service. NO
 * pasa por el web-bff-service (ese es la puerta del front público). El BFF, por
 * su lado, lee de cms-service el contenido ya publicado.
 *
 *   Equipo interno ─► Front CMS ─► cms-service ─► DB CMS
 *
 * La conexión es OPCIONAL y degradable: si `NEXT_PUBLIC_CMS_SERVICE_URL` no
 * está configurada (o el servicio no responde), la capa de servicios cae a los
 * datos de ejemplo (`mocks/`), igual que el front público con el BFF. Así el
 * backoffice se puede desarrollar sin el backend arriba.
 *
 * Autenticación (modelo Janis / api-gateway): cms-service confía en los headers
 * que inyecta el gateway (`x-user-id`, `x-client`, `x-user-permissions`). En
 * entorno interno/dev, si no llegan permisos asume `*`. El cliente envía un
 * contexto de admin configurable por env.
 */

const RAW_BASE = process.env.NEXT_PUBLIC_CMS_SERVICE_URL ?? ''
/** Base de cms-service, sin barra final. '' cuando no está configurada. */
export const CMS_BASE_URL = RAW_BASE.trim().replace(/\/$/, '')

/** true si el Front CMS está configurado para hablar con cms-service. */
export function isCmsBackendEnabled(): boolean {
  return CMS_BASE_URL.length > 0
}

const CMS_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_CMS_TIMEOUT_MS ?? 8000) || 8000
const ADMIN_USER_ID = process.env.NEXT_PUBLIC_CMS_ADMIN_USER_ID ?? 'cms-web'
const ADMIN_CLIENT = process.env.NEXT_PUBLIC_CMS_CLIENT ?? 'cms-web'
const ADMIN_PERMISSIONS = process.env.NEXT_PUBLIC_CMS_ADMIN_PERMISSIONS ?? '*'

export interface CmsError extends Error {
  code: string
  status: number
}

function makeCmsError(message: string, code: string, status: number): CmsError {
  const err = new Error(message) as CmsError
  err.code = code
  err.status = status
  return err
}

/** Respuesta paginada estándar de cms-service. */
export interface CmsPage<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface CmsRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  /** Paginación (se envía como headers x-janis-*). */
  page?: number
  pageSize?: number
  headers?: Record<string, string>
  signal?: AbortSignal
}

function buildQuery(query?: CmsRequestOptions['query']): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

function buildHeaders(options: CmsRequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-user-id': ADMIN_USER_ID,
    'x-client': ADMIN_CLIENT,
    'x-user-permissions': ADMIN_PERMISSIONS,
  }
  if (options.page != null) headers['x-janis-page'] = String(options.page)
  if (options.pageSize != null) headers['x-janis-page-size'] = String(options.pageSize)
  return { ...headers, ...(options.headers ?? {}) }
}

/**
 * Ejecuta una petición a cms-service. Lanza `CmsError` ante fallo HTTP, de red o
 * timeout. cms-service NO envuelve las respuestas: devuelve el DTO/paginado tal
 * cual, así que retornamos el JSON directo.
 */
export async function cmsRequest<T>(path: string, options: CmsRequestOptions = {}): Promise<T> {
  if (!isCmsBackendEnabled()) {
    throw makeCmsError('cms-service no configurado', 'CMS_DISABLED', 0)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), CMS_TIMEOUT_MS)
  if (options.signal) options.signal.addEventListener('abort', () => controller.abort(), { once: true })

  let res: Response
  try {
    res = await fetch(`${CMS_BASE_URL}${path}${buildQuery(options.query)}`, {
      method: options.method ?? 'GET',
      headers: buildHeaders(options),
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      credentials: 'include',
    })
  } catch (e) {
    clearTimeout(timeout)
    const aborted = e instanceof DOMException && e.name === 'AbortError'
    throw makeCmsError(aborted ? 'Timeout' : 'Error de red', aborted ? 'TIMEOUT' : 'NETWORK_ERROR', 0)
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    // cms-service: { statusCode, error, timestamp }
    let code = `HTTP_${res.status}`
    try {
      const body = (await res.json()) as { error?: unknown }
      if (typeof body?.error === 'string') code = body.error
    } catch {
      /* sin cuerpo */
    }
    throw makeCmsError(`Error ${res.status}`, code, res.status)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/**
 * Envuelve una llamada real con degradación a datos de ejemplo: si el backend
 * está deshabilitado o la llamada falla, devuelve el `fallback` (mock). Mantiene
 * el backoffice usable sin cms-service arriba y sin romper la UI.
 */
export async function withMockFallback<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  if (!isCmsBackendEnabled()) return fallback
  try {
    return await loader()
  } catch {
    return fallback
  }
}
