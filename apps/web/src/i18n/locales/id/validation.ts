import { createValidation } from '../../utils/createValidation'

const baseRules = {
  REQUIRED: 'Nilai wajib diisi',
  OPTIONAL: 'Nilai opsional',
  NULLABLE: 'Nilai boleh kosong',
  INVALID: 'Nilai tidak valid',
  INVALID_EMAIL: 'Format email tidak valid',
  EMPTY: 'Nilai tidak boleh kosong',
  INVALID_CHARS: 'Mengandung karakter tidak valid',
  MIN_LENGTH: 'Terlalu pendek',
  MAX_LENGTH: 'Terlalu panjang',
  LENGTH: 'Panjang karakter tidak sesuai',
  EMAIL: 'Format email tidak valid',
  NUMERIC: 'Hanya boleh berisi angka',
  NUMBER: 'Harus mengandung minimal 1 angka',
  LOWERCASE: 'Harus mengandung minimal 1 huruf kecil',
  UPPERCASE: 'Harus mengandung minimal 1 huruf besar',
  HAS_SPECIAL_CHAR: 'Harus mengandung minimal 1 karakter khusus',
} as const

const fieldValidations = createValidation(
  {
    USERNAME: ['REQUIRED', 'MIN_LENGTH', 'MAX_LENGTH', 'INVALID_CHARS'],
    EMAIL: ['REQUIRED', 'INVALID_EMAIL'],
    PHONE: ['NULLABLE', 'MIN_LENGTH', 'MAX_LENGTH', 'NUMERIC'],
    PASSWORD: [
      'REQUIRED',
      'MIN_LENGTH',
      'MAX_LENGTH',
      'UPPERCASE',
      'LOWERCASE',
      'NUMBER',
      'NUMERIC',
      'HAS_SPECIAL_CHAR',
    ],
    TIMEZONE: ['OPTIONAL'],
    IDENTIFIER: ['REQUIRED', 'MIN_LENGTH'],
  },
  baseRules,
)

export default {
  validation: {
    ...baseRules,
    ...fieldValidations,
    INVALID_UUID: 'Format UUID tidak valid',
    INVALID_EMAIL: 'Format email tidak valid',
    TENANT_NAME_REQUIRED: 'Nama workspace wajib diisi',
    TENANT_NAME_TOO_LONG: 'Nama workspace maksimal 100 karakter',
    INVITE_CODE_REQUIRED: 'Kode undangan wajib diisi',
    INVALID_TENANT_ID: 'ID workspace tidak valid',

    // Akun
    ACCOUNT_NAME_REQUIRED: 'Nama akun wajib diisi',
    ACCOUNT_NAME_TOO_LONG: 'Nama akun maksimal 100 karakter',
    ACCOUNT_NAME_TAKEN: 'Nama akun sudah dipakai di workspace ini',
    ACCOUNT_KIND_INVALID: 'Jenis akun tidak valid',
    ACCOUNT_GROUP_INVALID: 'Kategori akun tidak valid',
    ACCOUNT_BALANCE_INVALID: 'Saldo tidak valid',
    ACCOUNT_NOT_FOUND: 'Akun tidak ditemukan',
    ACCOUNT_HAS_TRANSACTIONS: 'Akun ini masih punya transaksi. Hapus transaksinya lebih dulu.',
    ACCOUNT_UPDATE_EMPTY: 'Tidak ada perubahan yang dikirim',

    // Transaksi
    TRANSACTION_TYPE_INVALID: 'Jenis transaksi tidak valid',
    AMOUNT_INVALID: 'Nominal tidak valid',
    AMOUNT_POSITIVE: 'Nominal harus lebih dari 0',
    CATEGORY_REQUIRED: 'Kategori wajib dipilih',
    ACCOUNT_REQUIRED: 'Akun wajib dipilih',
    TO_ACCOUNT_REQUIRED: 'Akun tujuan wajib dipilih untuk transfer',
    TO_ACCOUNT_SAME: 'Akun tujuan tidak boleh sama dengan akun asal',
    DATE_REQUIRED: 'Tanggal wajib diisi',
    DATE_INVALID: 'Format tanggal tidak valid',
    NOTE_TOO_LONG: 'Catatan maksimal 280 karakter',
    CURRENCY_INVALID: 'Kode mata uang tidak valid',
  },
} as const
