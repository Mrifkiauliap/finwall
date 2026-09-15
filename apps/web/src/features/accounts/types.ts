import type {
  Account as AccountDto,
  AccountListResponse,
  AccountSummary,
  AccountType,
  AccountTypeSummary,
} from '@finwall/shared'

/**
 * Tipe akun untuk UI.
 *
 * Bentuk data akhir dimiliki backend; tipe-nya di-RE-EXPORT dari
 * `@finwall/shared` agar tidak ada duplikasi kontrak. Yang ditambahkan di sini
 * hanya label tampilan (mis. `ASSET_TYPES`) yang tidak dipakai server.
 */

export type {
  AccountDto as Account,
  AccountListResponse,
  AccountSummary,
  AccountType,
  AccountTypeSummary,
}

/** Filter daftar akun pada panel/daftar. */
export type AccountsFilter = 'all' | 'active' | 'inactive'

/**
 * Pengelompokan tampilan berdasarkan jenis akun.
 *
 * Database hanya menyimpan `type` teknis (cash, bank, ...), sedangkan istilah
 * yang dilihat pengguna ("Aset" / "Utang") adalah keputusan tampilan. Urutan di
 * sini juga menentukan urutan grup di UI.
 */
export interface AccountTypeDefinition {
  type: AccountType
  /** i18n key label, mis. `accounts.TYPES.CASH`. */
  labelKey: string
  /** `asset` menambah kekayaan, `debt` menguranginya. */
  nature: 'asset' | 'debt'
  /** Nama ikon Lucide. */
  icon: string
}

export const ACCOUNT_TYPE_DEFS: AccountTypeDefinition[] = [
  { type: 'cash', labelKey: 'accounts.TYPES.CASH', nature: 'asset', icon: 'Banknote' },
  { type: 'bank', labelKey: 'accounts.TYPES.BANK', nature: 'asset', icon: 'Landmark' },
  { type: 'e_wallet', labelKey: 'accounts.TYPES.E_WALLET', nature: 'asset', icon: 'Smartphone' },
  {
    type: 'investment',
    labelKey: 'accounts.TYPES.INVESTMENT',
    nature: 'asset',
    icon: 'TrendingUp',
  },
  { type: 'other', labelKey: 'accounts.TYPES.OTHER', nature: 'debt', icon: 'CircleDollarSign' },
]

/** Akun yang dikelompokkan untuk tampilan daftar. */
export interface AccountGroup {
  type: AccountType
  labelKey: string
  nature: 'asset' | 'debt'
  icon: string
  accounts: AccountDto[]
  total: number
}
