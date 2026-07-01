'use client'

import { useMemo, useState } from 'react'
import { useCmsResource } from '@/features/cms/hooks/useCmsResource'
import { simulateRequest } from '@/features/cms/services/simulate'
import { segments } from '@/features/cms/mocks'
import { CHANNEL_LABEL, SEGMENT_TYPE_LABEL } from '@/features/cms/constants'
import type { CmsSegmentType } from '@/features/cms/types'
import { FilterBar, type FilterDef } from '@/features/cms/components/common/FilterBar'
import { Button, CmsIcon, EmptyState, IconButton, PageHeader, Pill, ResourceState } from '@/features/cms/components/ui'

const COLS = 'minmax(200px,1.6fr) 1.1fr 0.8fr 0.9fr 44px'

export function SegmentBuilder() {
  const { state, data, error } = useCmsResource(() => simulateRequest(segments), [])
  const [values, setValues] = useState<Record<string, string>>({ q: '', type: 'all', channel: 'all' })
  const setV = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }))

  const rows = useMemo(
    () =>
      (data ?? []).filter((s) => {
        if (values.type !== 'all' && s.type !== values.type) return false
        if (values.channel !== 'all' && s.channel !== values.channel) return false
        return !values.q || s.name.toLowerCase().includes(values.q.toLowerCase())
      }),
    [data, values],
  )

  const fields: FilterDef[] = [
    { key: 'q', label: 'Segmento', type: 'text', placeholder: 'Buscar segmento…' },
    { key: 'type', label: 'Tipo', type: 'select', options: [{ value: 'all', label: 'Todos' }, ...(Object.keys(SEGMENT_TYPE_LABEL) as CmsSegmentType[]).map((t) => ({ value: t, label: SEGMENT_TYPE_LABEL[t] }))] },
    { key: 'channel', label: 'Canal', type: 'select', options: [{ value: 'all', label: 'Todos' }, { value: 'b2c', label: 'B2C' }, { value: 'b2b', label: 'B2B' }, { value: 'both', label: 'B2C + B2B' }] },
  ]

  return (
    <div>
      <PageHeader eyebrow="Segmentación" title="Segmentos" subtitle="Segmentos B2C/B2B (crédito, sucursal, lista de precio, rubro, zona) para personalizar contenido con fallback general." actions={<Button variant="green" icon="plus">Nuevo segmento</Button>} />
      <FilterBar fields={fields} values={values} onChange={setV} />
      <ResourceState state={state} error={error} empty={<EmptyState icon="segment" title="Sin segmentos" />}>
        <>
          <div className="jc-listhead" style={{ gridTemplateColumns: COLS }}><span>Segmento</span><span>Tipo</span><span>Canal</span><span>Miembros</span><span></span></div>
          <div className="jc-rows">
            {rows.map((s) => (
              <div key={s.id} className="jc-row jc-row--brand" style={{ gridTemplateColumns: COLS }}>
                <div><div className="jc-row__title">{s.name}</div><div className="jc-row__meta">{s.description}</div></div>
                <Pill tone="default" soft>{SEGMENT_TYPE_LABEL[s.type]}</Pill>
                <span>{CHANNEL_LABEL[s.channel]}</span>
                <span style={{ fontWeight: 700 }}>{s.members > 0 ? s.members.toLocaleString('es-CL') : '—'}</span>
                <div style={{ display: 'flex', gap: 6 }}><IconButton icon="eye" aria-label="Previsualizar como" /><IconButton icon="edit" /></div>
              </div>
            ))}
          </div>
          <p className="jc-help" style={{ marginTop: 12 }}><CmsIcon name="eye" /> Previsualiza la web “como” cada segmento desde el Preview Center.</p>
        </>
      </ResourceState>
    </div>
  )
}
