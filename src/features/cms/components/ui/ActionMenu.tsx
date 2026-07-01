'use client'

import { useEffect, useRef, useState } from 'react'
import { CmsIcon, type CmsIconName } from './CmsIcon'

export interface MenuAction {
  label: string
  icon: CmsIconName
  onClick?: () => void
  danger?: boolean
}

/** Botón "..." con popover de acciones (estilo Janis edit view). */
export function ActionMenu({ actions }: { actions: MenuAction[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="jc-actionmenu" ref={ref}>
      <button className="jc-iconbtn" onClick={() => setOpen((o) => !o)} aria-label="Más acciones" aria-haspopup="menu" aria-expanded={open}>
        <CmsIcon name="dots" />
      </button>
      {open && (
        <div className="jc-actionmenu__pop" role="menu">
          {actions.map((a) => (
            <button key={a.label} className={`jc-actionmenu__item ${a.danger ? 'is-danger' : ''}`} role="menuitem" onClick={() => { setOpen(false); a.onClick?.() }}>
              <CmsIcon name={a.icon} /> {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
