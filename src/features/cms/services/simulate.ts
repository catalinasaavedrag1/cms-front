/** Simula una request async a un microservicio (mientras no hay backend real). */
export function simulateRequest<T>(data: T, delay = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay))
}

/** Error del backend → mensaje amigable para el toast del backoffice. */
export function toUiError(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message && e.message !== 'Error') {
    const code = (e as { code?: string }).code
    if (code === 'NETWORK_ERROR' || code === 'TIMEOUT') return `${fallback}: cms-service no responde`
    return `${fallback} (${code ?? e.message})`
  }
  return fallback
}
