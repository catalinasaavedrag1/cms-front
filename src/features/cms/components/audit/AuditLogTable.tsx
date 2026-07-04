'use client'

import { useMemo, useState } from 'react'
import { useCmsResource } from '@/features/cms/hooks/useCmsResource'
import { cmsAuditApi } from '@/features/cms/services/cms-audit.api'
import { auditLogs } from '@/features/cms/mocks'
import { FilterBar, type FilterDef } from '@/features/cms/components/common/FilterBar'
import { Avatar, Button, CmsIcon, EmptyState, IconButton, PageHeader, Pagination, ResourceState } from '@/features/cms/components/ui'

const COLS = '160px 1fr 1.4fr 44px'
const USERS = Array.from(new Set(auditLogs.map((a) => a.user)))
const TYPES = Array.from(new Set(auditLogs.map((a) => a.entityType)))

export function AuditLogTable() {
  const { state, data, error } = useCmsResource(() => cmsAuditApi.list(), [])
  const [values, setValues] = useState<Record<string, string>>({ q: '', user: 'all', type: 'all' })
  const setV = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }))
  const rows = useMemo(
    () =>
      (data ?? []).filter((a) => {
        if (values.user !== 'all' && a.user !== values.user) return false
        if (values.type !== 'all' && a.entityType !== values.type) return false
        return !values.q || `${a.user} ${a.action} ${a.entityName}`.toLowerCase().includes(values.q.toLowerCase())
      }),
    [data, values],
  )
  const fields: FilterDef[] = [
    { key: 'q', label: 'Buscar', type: 'text', placeholder: 'Usuario, acción o contenido…' },
    { key: 'user', label: 'Usuario', type: 'select', options: [{ value: 'all', label: 'Todos' }, ...USERS.map((u) => ({ value: u, label: u }))] },
    { key: 'type', label: 'Entidad', type: 'select', options: [{ value: 'all', label: 'Todas' }, ...TYPES.map((t) => ({ value: t, label: t }))] },
  ]

  return (
    <div>
      <PageHeader eyebrow="Gobierno" title="Auditoría" subtitle="Registro completo: usuario, acción, contenido, valor anterior/nuevo, fecha y estado." actions={<Button variant="blue" icon="export">Exportar</Button>} />
      <FilterBar fields={fields} values={values} onChange={setV} dateRange />
      <ResourceState state={state} error={error} empty={<EmptyState icon="audit" title="Sin registros" />}>
        <>
          <div className="jc-listhead" style={{ gridTemplateColumns: COLS }}><span>Fecha</span><span>Usuario / Acción</span><span>Cambio</span><span></span></div>
          <div className="jc-rows">
            {rows.map((a) => (
              <div key={a.id} className="jc-row jc-row--default" style={{ gridTemplateColumns: COLS }}>
                <span className="jc-mono" style={{ fontSize: '0.78rem' }}>{a.at}</span>
                <div className="jc-userin"><Avatar name={a.user} /><div><div style={{ fontSize: '0.86rem' }}><strong>{a.user}</strong></div><small className="jc-muted">{a.action} · {a.entityType} · {a.entityName}</small></div></div>
                <div style={{ fontSize: '0.84rem' }}><span className="jc-muted">{a.before}</span> <CmsIcon name="chevron" /> <strong>{a.after}</strong></div>
                <IconButton icon="eye" />
              </div>
            ))}
          </div>
          <Pagination total={rows.length} />
        </>
      </ResourceState>
    </div>
  )
}
