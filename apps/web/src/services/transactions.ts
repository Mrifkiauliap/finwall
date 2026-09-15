import type { TransactionFormSchemaValues } from '@/features/transaction/schemas/transaction.schema'
import type { Transaction } from '@/features/transaction/types'
import { api } from '@/services/api'

/**
 * Lapisan akses data transaksi (tenant-scoped).
 *
 * Endpoint `/tenants/{id}/transactions` belum ada di backend, jadi `fetch`
 * mengembalikan daftar kosong. Ini satu-satunya titik integrasi: ganti isi
 * fungsi saat endpoint siap, tanpa menyentuh komponen.
 */

export async function fetchTransactions(tenantPublicId: string): Promise<Transaction[]> {
  // TODO: ganti dengan panggilan nyata:
  // const res = await api.get(`/tenants/${tenantPublicId}/transactions`)
  // return res.data.transactions
  void api
  void tenantPublicId
  return []
}

export async function createTransaction(
  tenantPublicId: string,
  payload: TransactionFormSchemaValues,
): Promise<Transaction> {
  const res = await api.post(`/tenants/${tenantPublicId}/transactions`, payload)
  return res.data as Transaction
}

export async function deleteTransaction(
  tenantPublicId: string,
  transactionId: string,
): Promise<void> {
  await api.delete(`/tenants/${tenantPublicId}/transactions/${transactionId}`)
}
