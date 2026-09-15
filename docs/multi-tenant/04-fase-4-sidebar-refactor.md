# Fase 4 — Refactor Sidebar & Pembersihan Kode

**Status:** ✅ Selesai
**Ruang lingkup:** `apps/web` (UI + pembersihan).

## Tujuan

1. Sidebar dua kolom: **rail ikon permanen** + **panel akun/aset** yang bisa
   dibuka-tutup.
2. Membersihkan kode yang tidak terpakai dan menyambungkan bagian yang masih
   menggantung setelah migrasi tenant.

## Keputusan desain

**"Akun" vs "Workspace" tidak digabung** — keduanya konsep berbeda:

|          | Workspace (tenant)  | Akun (aset)                        |
| -------- | ------------------- | ---------------------------------- |
| Sifat    | Wadah data          | Isi data                           |
| Contoh   | "Keuangan Keluarga" | Kas, Bank BCA, Kartu Kredit        |
| Skema DB | `tenants`           | `accounts.tenantId` → `tenants.id` |

Panel akun selalu menampilkan akun **dari workspace yang sedang aktif** (tenant
di URL). Jadi pindah workspace = pindah daftar akun.

## Struktur baru

```text
layouts/default.vue
├── SidebarRail.vue      → kolom 1: ikon saja, permanen di desktop
├── AccountsPanel.vue    → kolom 2: akun/aset/utang, bisa ditutup
├── AppHeader.vue        → workspace switcher + breadcrumb + akun user
└── <slot />             → konten halaman
```

### Redirect root dilakukan sebelum render

`/` sebelumnya mengarahkan secara imperatif di dalam
[`pages/index.vue`](../../apps/web/app/pages/index.vue) (`await authStore.init()`
lalu `navigateTo()`), sehingga halaman ter-render lebih dulu dan menyisakan
kedipan / state setengah jadi sebelum lompat.

Sekarang redirect ditangani [`middleware/route.global.ts`](../../apps/web/app/middleware/route.global.ts)
**sebelum** halaman dirender:

```ts
// / -> signin (belum login) atau landingPath (sudah login)
const authStore = useAuthStore();
await authStore.init();
if (!authStore.isAuthenticated) return navigateTo("/signin");
return navigateTo(useTenant().landingPath());
```

`pages/index.vue` tinggal menampilkan `SplashLoading` sebagai jaring pengaman
(bila middleware dilewati) dan saat SSR.

### Loading saat inisialisasi data

Overlay loading tampil di **setiap inisialisasi data**, bukan hanya saat switch
workspace:

| Titik inisialisasi                                  | Dipanggil dari                   | Gaya            |
| --------------------------------------------------- | -------------------------------- | --------------- |
| Restore sesi (`fetchMe`)                            | `plugins/auth-restore.ts`        | splash bermerek |
| Resolve tenant + verifikasi membership              | `middleware/tenant.ts`           | splash bermerek |
| Aksi manual (switch workspace, retry daftar tenant) | `usePageLoading().withLoading()` | kartu spinner   |

`usePageLoading()` memisahkan dua sumber agar tidak saling menimpa:

- `bootLoading` — inisialisasi data
- `uiLoading` — aksi manual

`isLoading = bootLoading || uiLoading`. Pemisahan ini penting karena
`hideLoading()` dari satu alur (mis. `finishReloadLoading()` saat `onMounted`)
sebelumnya bisa mematikan loading yang sedang berjalan di alur lain.

Overlay ditutup setelah **navigasi awal benar-benar siap**
(`await router.isReady()` di `app.vue`), sehingga tidak ada layar kosong atau
konten tanpa data. Ada pengaman `10s` supaya overlay tidak menggantung bila API
tidak merespons.

Splash bermerek diekstrak ke `SplashLoading.vue` — dipakai halaman root
([`pages/index.vue`](../../apps/web/app/pages/index.vue)) **dan** overlay boot,
sehingga tidak ada markup duplikat.

### Header: breadcrumb otomatis

`AppBreadcrumb.vue` + `useBreadcrumbs()` membangun trail dari `route.path`, jadi
tidak perlu menulis breadcrumb manual per halaman.

| URL                         | Breadcrumb                         |
| --------------------------- | ---------------------------------- |
| `/t/{id}/dashboard`         | Dashboard                          |
| `/t/{id}/transactions`      | Transaksi                          |
| `/t/{id}/workspace/members` | Pengaturan Workspace › Anggota Tim |
| `/settings/preferences`     | Pengaturan › Preferensi            |
| `/help`                     | Bantuan                            |

Aturan:

- Segmen literal `t` dan `tenantPublicId` **dilewati** — konteks workspace sudah
  diwakili workspace switcher di sebelah kiri breadcrumb.
- Segmen tanpa label terdaftar (mis. id dinamis, `create-modal`) dilewati.
- Item terakhir = halaman aktif (tidak diklik, `aria-current="page"`).
- Menambah halaman baru = tambah satu baris di `SEGMENT_LABEL_KEYS`.

Prop `title` dan slot `#title` pada `AppHeader` **dihapus** — keduanya tidak
dipakai satu halaman pun dan sudah digantikan breadcrumb.

### Kolom 1 — `SidebarRail.vue`

- Lebar tetap `w-16`, hanya ikon + label kecil.
- Item dibangun dari `useNavigation()` (otomatis tenant-aware).
- Tombol toggle untuk membuka-tutup panel akun.

### Kolom 2 — `AccountsPanel.vue`

Mengikuti referensi desain (Monarch/Copilot):

- Segmented control **All / Assets / Debts**.
- Grup collapsible: Kas, Investasi, Kripto, Properti, Kendaraan, Aset Lainnya,
  Kartu Kredit, Pinjaman, Utang Lainnya.
- Baris aksi "Akun baru" di atas.
- Ringkasan bawah: Total Aset, Total Utang, Kekayaan Bersih.

### State

`useSidebar()` sekarang mengelola dua hal:

| State         | Fungsi                            |
| ------------- | --------------------------------- |
| `isOpen`      | Drawer off-canvas (mobile/tablet) |
| `isPanelOpen` | Buka-tutup panel akun (kolom 2)   |

Di mobile, rail + panel menjadi **satu drawer** (fixed, `-translate-x-full`,
muncul saat `isOpen`).

## Perubahan lain

### Workspace switcher pindah ke header

Sesuai permintaan (bagian kiri-bawah tidak dipakai lagi), pemilih workspace
dipindah ke `AppHeader`. `WorkspaceSwitcher` diberi prop `compact` untuk varian
header (tanpa subtitle role), sementara varian penuh tetap tersedia.

### Filter aset/utang dibagi dua arah

State `filter` di [`useAccountsRail`](../../apps/web/app/composables/useAccountsRail.ts)
dipakai bersama oleh **panel sidebar** dan **halaman akun** — mengubah filter di
salah satu langsung sinkron dengan yang lain.

### Halaman akun kini terintegrasi

[`pages/t/[tenantPublicId]/accounts/index.vue`](../../apps/web/app/pages/t/%5BtenantPublicId%5D/accounts/index.vue)
sebelumnya **file kosong (0 baris)**. Sekarang berisi kartu ringkasan + daftar
grup + filter, memakai composable yang sama dengan panel.

## Kode yang dihapus

| Item                                                     | Alasan                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `components/data/SkeletonTable.vue`                      | Tidak pernah diimpor di mana pun (pakai warna gray hardcoded, bukan design token) |
| `components/common/CommandMenu.vue`                      | File kosong, hanya di-render sebagai komentar di `app.vue`                        |
| `components/layout/AppSidebar.vue`                       | Digantikan `SidebarRail` + `AccountsPanel`                                        |
| `assets/css/main.css.bak`                                | File backup                                                                       |
| Getter `hasTenant` / `isOwner` / `isAdmin` di store auth | Tidak terpakai; cek role dipindah ke `usePermission()` + `TenantGuard`            |

## Kode yang disambungkan

| Sebelum                                                                                                             | Sesudah                                               |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `PageLoadingOverlay` punya fallback `t("workspace.SWITCHING")` yang membuat fallback berikutnya tak pernah tercapai | Fallback langsung ke `t("common.MESSAGE.PROCESSING")` |
| Halaman `accounts` kosong                                                                                           | Terintegrasi dengan panel akun                        |
| Komentar `<!-- <CommandMenu /> Coming Soon -->` di `app.vue`                                                        | Dihapus                                               |
| Komentar `<!-- Account Information -->` di sidebar lama                                                             | Dihapus                                               |

## Data & batasan

`useAccountsRail` saat ini mengembalikan **daftar kosong** (empty state tampil).
Endpoint tenant-scoped untuk akun belum ada. Saat dibuat:

```ts
// TODO di useAccountsRail.ts
GET / tenants / { tenantPublicId } / accounts;
```

Wajib memakai `@UseGuards(JwtAuthGuard, TenantGuard)` mengikuti pola
[`TenantResourceController`](../../apps/api/src/modules/auth/tenant/tenant-resource.controller.ts)
(Fase 2).

## Verifikasi

```bash
pnpm --filter @finwall/web exec nuxt prepare
pnpm --filter @finwall/web run check-types   # lolos
```
