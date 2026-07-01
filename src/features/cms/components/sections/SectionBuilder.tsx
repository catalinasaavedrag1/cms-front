'use client'

import { useMemo, useState } from 'react'
import { useCmsResource } from '@/features/cms/hooks/useCmsResource'
import { simulateRequest } from '@/features/cms/services/simulate'
import { sections } from '@/features/cms/mocks'
import { CHANNEL_LABEL, STATUS_META, type Tone } from '@/features/cms/constants'
import type { CmsStatus, SectionGroup } from '@/features/cms/types'
import { FilterBar, type FilterDef } from '@/features/cms/components/common/FilterBar'
import { Button, EmptyState, IconButton, PageHeader, Pill, ResourceState, StatusPill } from '@/features/cms/components/ui'

const COLS = '56px minmax(200px,1.6fr) 1fr 0.8fr 0.9fr 44px'
const GROUP_LABEL: Record<SectionGroup, string> = { banners: 'Banners', products: 'Productos', content: 'Contenido', navigation: 'Navegación' }
const STATUS_LIST: CmsStatus[] = ['published', 'draft', 'changes_requested', 'in_review']
const groupColor: Record<SectionGroup, string> = {
  banners: 'linear-gradient(120deg,#1f4aa8,#2979ff)', products: 'linear-gradient(120deg,#0f6347,#2ecc71)',
  content: 'linear-gradient(120deg,#7a4a1d,#fb8c00)', navigation: 'linear-gradient(120deg,#5b2a86,#a06cec)',
}
const rowMod = (t: Tone) => (t === 'success' ? '' : t === 'info' ? 'jc-row--brand' : `jc-row--${t}`)

export function SectionBuilder() {
  const { state, data, error } = useCmsResource(() => simulateRequest(sections), [])
  const [values, setValues] = useState<Record<string, string>>({ q: '', group: 'all', status: 'all' })
  const setV = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }))

  const rows = useMemo(
    () =>
      (data ?? []).filter((s) => {
        if (values.group !== 'all' && s.group !== values.group) return false
        if (values.status !== 'all' && s.status !== values.status) return false
        return !values.q || s.internalName.toLowerCase().includes(values.q.toLowerCase())
      }),
    [data, values],
  )

  const fields: FilterDef[] = [
    { key: 'q', label: 'Sección', type: 'text', placeholder: 'Buscar sección…' },
    { key: 'group', label: 'Grupo', type: 'select', options: [{ value: 'all', label: 'Todos' }, ...(Object.keys(GROUP_LABEL) as SectionGroup[]).map((g) => ({ value: g, label: GROUP_LABEL[g] }))] },
    { key: 'status', label: 'Estado', type: 'select', options: [{ value: 'all', label: 'Todos' }, ...STATUS_LIST.map((s) => ({ value: s, label: STATUS_META[s].label }))] },
  ]

  return (
    <div>
      <PageHeader eyebrow="Contenido" title="Section Builder" subtitle="Biblioteca de secciones reutilizables (banners, productos, contenido, navegación) con config desktop/mobile y reglas." actions={<Button variant="green" icon="plus">Nueva sección</Button>} />
      <FilterBar fields={fields} values={values} onChange={setV} />
      <ResourceState state={state} error={error} empty={<EmptyState icon="sections" title="Sin secciones" />}>
        <>
          <div className="jc-listhead" style={{ gridTemplateColumns: COLS }}><span></span><span>Sección</span><span>Tipo</span><span>Canal</span><span>Estado</span><span></span></div>
          <div className="jc-rows">
            {rows.map((s) => (
              <div key={s.id} className={`jc-row ${rowMod(STATUS_META[s.status].tone)}`} style={{ gridTemplateColumns: COLS }}>
                <span className="jc-thumb" style={{ width: 46, height: 34, background: groupColor[s.group] }} />
                <div><div className="jc-row__title">{s.internalName}</div><div className="jc-row__meta">Orden {s.order} · {s.updatedBy}</div></div>
                <Pill tone="default" soft>{s.type.replace(/_/g, ' ')}</Pill>
                <span>{CHANNEL_LABEL[s.channel]}</span>
                <StatusPill status={s.status} soft />
                <IconButton icon="edit" />
              </div>
            ))}
          </div>
        </>
      </ResourceState>
    </div>
  )
}
