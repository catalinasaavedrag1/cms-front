/**
 * Overview del dashboard. cms-service NO expone un endpoint de dashboard
 * agregado (KPIs/alertas/actividad), así que hoy es mock. Cuando se defina,
 * puede componerse de `/audit` (actividad) y `/publishing/jobs` (pendientes).
 * Ver docs/CONTRATOS-CMS.md → "Gaps del cms-service".
 */
import { simulateRequest } from './simulate'
import { dashboardActivity, dashboardAlerts, dashboardKpis, pendingPublications } from '@/features/cms/mocks'

export interface DashboardOverview {
  kpis: typeof dashboardKpis
  alerts: typeof dashboardAlerts
  activity: typeof dashboardActivity
  pending: typeof pendingPublications
}

export const cmsDashboardApi = {
  getOverview: (): Promise<DashboardOverview> =>
    simulateRequest({ kpis: dashboardKpis, alerts: dashboardAlerts, activity: dashboardActivity, pending: pendingPublications }),
}
