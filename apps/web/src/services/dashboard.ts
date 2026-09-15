import { api } from '@/services/api'
import type { DashboardResponse } from '@finwall/shared'

/**
 * Ringkasan dashboard tenant (tenant-scoped).
 *
 * Endpoint backend: `GET /tenants/:tenantPublicId/dashboard`
 * (lihat `DashboardController`).
 */
export async function fetchDashboard(tenantPublicId: string): Promise<DashboardResponse> {
  const res = await api.get(`/tenants/${tenantPublicId}/dashboard`)
  return res.data as DashboardResponse
}
