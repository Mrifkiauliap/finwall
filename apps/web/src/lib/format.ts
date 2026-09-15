/**
 * Pemformatan nilai finansial.
 *
 * Dipusatkan di sini supaya seluruh tampilan memakai aturan yang sama:
 * pemisah ribuan, simbol mata uang, dan jumlah desimal per mata uang.
 */

const LOCALE_BY_APP_LOCALE: Record<string, string> = {
  id: 'id-ID',
  en: 'en-US',
}

export function resolveIntlLocale(appLocale?: string): string {
  return LOCALE_BY_APP_LOCALE[appLocale ?? 'id'] ?? 'id-ID'
}

/**
 * Format nominal mata uang.
 *
 * IDR ditampilkan tanpa desimal karena pecahannya tidak dipakai sehari-hari;
 * mata uang lain memakai 2 desimal standar.
 */
export function formatCurrency(value: number, currency = 'IDR', appLocale = 'id'): string {
  return new Intl.NumberFormat(resolveIntlLocale(appLocale), {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'IDR' ? 0 : 2,
    minimumFractionDigits: currency === 'IDR' ? 0 : 2,
  }).format(value)
}

/** Format angka biasa (tanpa simbol mata uang). */
export function formatNumber(value: number, appLocale = 'id'): string {
  return new Intl.NumberFormat(resolveIntlLocale(appLocale)).format(value)
}

/**
 * Tanggal pendek dari `YYYY-MM-DD`, mis. "15 Sep 2026".
 *
 * Ditambahkan `T00:00:00` agar tanggal diurai sebagai waktu LOKAL, bukan UTC —
 * tanpa itu, tanggal bisa bergeser satu hari di zona waktu barat.
 */
export function formatDate(value: string, appLocale = 'id'): string {
  return new Intl.DateTimeFormat(resolveIntlLocale(appLocale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

/** Tanggal + jam dari string ISO, mis. "15 Sep 2026, 14:30". */
export function formatDateTime(iso: string, appLocale = 'id'): string {
  return new Intl.DateTimeFormat(resolveIntlLocale(appLocale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/**
 * Nama bulan pendek dari kunci `YYYY-MM`, mis. "Sep".
 *
 * Memakai `Date.UTC` supaya label tidak bergeser bulan karena perbedaan zona
 * waktu antara server dan klien.
 */
export function formatMonthLabel(monthKey: string, appLocale = 'id'): string {
  const [year, month] = monthKey.split('-')
  if (!year || !month) return monthKey

  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
  return new Intl.DateTimeFormat(resolveIntlLocale(appLocale), {
    month: 'short',
    timeZone: 'UTC',
  }).format(date)
}
