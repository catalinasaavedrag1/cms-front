'use client'

import { useMemo, useState } from 'react'
import { useCmsResource } from '@/features/cms/hooks/useCmsResource'
import { simulateRequest } from '@/features/cms/services/simulate'
import { faqs } from '@/features/cms/mocks'
import { CHANNEL_LABEL, STATUS_META, type Tone } from '@/features/cms/constants'
import type { FaqScope } from '@/features/cms/types'
import { FilterBar, type FilterDef } from '@/features/cms/components/common/FilterBar'
import { Button, CmsIcon, EmptyState, IconButton, PageHeader, Pill, ResourceState, StatusPill } from '@/features/cms/components/ui'

const SCOPE_LABEL: Record<FaqScope, string> = { category: 'Categoría', product: 'Producto', landing: 'Landing', shipping: 'Despacho', returns: 'Devoluciones', b2b: 'B2B', checkout: 'Checkout' }
const rowMod = (t: Tone) => (t === 'success' ? '' : t === 'info' ? 'jc-row--brand' : `jc-row--${t}`)

export function FaqBuilder() {
  const { state, data, error } = useCmsResource(() => simulateRequest(faqs), [])
  const [open, setOpen] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({ q: '', scope: 'all', channel: 'all' })
  const setV = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }))
  const rows = useMemo(
    () =>
      (data ?? []).filter((f) => {
        if (values.scope !== 'all' && f.scope !== values.scope) return false
        if (values.channel !== 'all' && f.channel !== values.channel) return false
        return !values.q || f.question.toLowerCase().includes(values.q.toLowerCase())
      }),
    [data, values],
  )
  const fields: FilterDef[] = [
    { key: 'q', label: 'Pregunta', type: 'text', placeholder: 'Buscar pregunta…' },
    { key: 'scope', label: 'Alcance', type: 'select', options: [{ value: 'all', label: 'Todos' }, ...(Object.keys(SCOPE_LABEL) as FaqScope[]).map((s) => ({ value: s, label: SCOPE_LABEL[s] }))] },
    { key: 'channel', label: 'Canal', type: 'select', options: [{ value: 'all', label: 'Todos' }, { value: 'b2c', label: 'B2C' }, { value: 'b2b', label: 'B2B' }, { value: 'both', label: 'B2C + B2B' }] },
  ]

  return (
    <div>
      <PageHeader eyebrow="Contenido" title="FAQ / Help Builder" subtitle="FAQ por categoría, producto, landing, despacho, devoluciones, B2B o checkout, con orden drag & drop y schema FAQ." actions={<Button variant="green" icon="plus">Nueva pregunta</Button>} />
      <FilterBar fields={fields} values={values} onChange={setV} />
      <ResourceState state={state} error={error} empty={<EmptyState icon="faq" title="Sin preguntas" />}>
        <div className="jc-rows">
          {rows.map((f) => (
            <div key={f.id} className={`jc-row ${rowMod(STATUS_META[f.status].tone)}`} style={{ gridTemplateColumns: '20px 1fr auto', alignItems: 'start' }}>
              <span style={{ color: '#b5bcc7', cursor: 'grab', paddingTop: 3 }}><CmsIcon name="drag" /></span>
              <div>
                <button onClick={() => setOpen(open === f.id ? null : f.id)} style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', font: 'inherit' }}>
                  <div className="jc-row__title">{f.question}</div>
                </button>
                {open === f.id && <p style={{ margin: '8px 0 0', color: 'var(--jc-ink-2)', fontSize: '0.88rem' }}>{f.answer}</p>}
                <div className="jc-row__meta" style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Pill tone="default" soft>{SCOPE_LABEL[f.scope]}</Pill>
                  <Pill tone="default" soft>{CHANNEL_LABEL[f.channel]}</Pill>
                  {f.schemaEnabled && <Pill tone="info" soft>Schema FAQ</Pill>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StatusPill status={f.status} soft />
                <IconButton icon="edit" />
              </div>
            </div>
          ))}
        </div>
      </ResourceState>
    </div>
  )
}
