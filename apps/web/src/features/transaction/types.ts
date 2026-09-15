/**
 * Tipe domain transaksi (pemasukan/pengeluaran) untuk halaman Transaksi.
 *
 * Dipakai bersama oleh form dan tabel. Kolom mengikuti model akuntansi:
 * uang berpindah dari satu akun ke akun lain dengan satu nominal yang sama.
 */

export type TransactionType = 'income' | 'expense' | 'transfer'

export interface Transaction {
  id: string
  type: TransactionType
  /** Nominal selalu positif; arah ditentukan oleh `type`. */
  amount: number
  currency: string
  /** i18n key kategori, mis. `transactions.CATEGORY.FOOD`. */
  categoryKey: string
  /** Akun asal (pengeluaran) atau tujuan (pemasukan). */
  accountId: string
  /** Akun tujuan untuk `type === 'transfer'`. */
  toAccountId?: string
  /** Tanggal ISO (YYYY-MM-DD). */
  date: string
  note?: string
}

export interface TransactionFormValues {
  type: TransactionType
  amount: number
  currency: string
  categoryKey: string
  accountId: string
  toAccountId?: string
  date: string
  note?: string
}

export interface TransactionFilterState {
  /** Teks bebas untuk catatan. */
  search: string
  type: TransactionType | 'all'
  /** Rentang tanggal ISO; kosong = tanpa batas. */
  from: string
  to: string
}

export interface TransactionSummary {
  income: number
  expense: number
  net: number
}
