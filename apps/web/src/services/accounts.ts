import type { Account, AccountListResponse } from '@/features/accounts/types'
import { api } from '@/services/api'
import type { CreateAccountRequest, UpdateAccountRequest } from '@finwall/shared'

/**
 * Lapisan akses data akun (tenant-scoped).
 *
 * Endpoint backend: `/tenants/:tenantPublicId/accounts` (lihat
 * `AccountController`). Semua panggilan sudah lewat `api` sehingga cookie
 * httpOnly, refresh token, dan pembungkusan `{ data }` ditangani otomatis.
 */

export async function fetchAccounts(tenantPublicId: string): Promise<AccountListResponse> {
  const res = await api.get(`/tenants/${tenantPublicId}/accounts`)
  return res.data as AccountListResponse
}

export async function createAccount(
  tenantPublicId: string,
  payload: CreateAccountRequest,
): Promise<Account> {
  const res = await api.post(`/tenants/${tenantPublicId}/accounts`, payload)
  return res.data as Account
}

export async function updateAccount(
  tenantPublicId: string,
  accountPublicId: string,
  payload: UpdateAccountRequest,
): Promise<Account> {
  const res = await api.patch(`/tenants/${tenantPublicId}/accounts/${accountPublicId}`, payload)
  return res.data as Account
}

export async function deleteAccount(
  tenantPublicId: string,
  accountPublicId: string,
): Promise<{ message: string }> {
  const res = await api.delete(`/tenants/${tenantPublicId}/accounts/${accountPublicId}`)
  return res.data as { message: string }
}
