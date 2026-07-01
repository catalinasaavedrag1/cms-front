'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CmsIcon } from './CmsIcon'

type ToastKind = 'success' | 'info' | 'error'
interface ToastItem { id: number; kind: ToastKind; msg: string }
interface ToastCtxValue { push: (kind: ToastKind, msg: string) => void }

const ToastCtx = createContext<ToastCtxValue | null>(null)
let seq = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const push = useCallback((kind: ToastKind, msg: string) => {
    const id = seq++
    setItems((prev) => [...prev, { id, kind, msg }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2800)
  }, [])

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="jc-toaster" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`jc-toast jc-toast--${t.kind}`}>
            <span className="jc-toast__ic"><CmsIcon name={t.kind === 'error' ? 'warning' : t.kind === 'info' ? 'bell' : 'check'} /></span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/** Devuelve `push(kind, msg)`. Si no hay provider, es no-op (seguro en SSR). */
export function useToast(): ToastCtxValue {
  return useContext(ToastCtx) ?? { push: () => {} }
}
