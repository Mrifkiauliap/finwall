# Fase 1 — Frontend Tenant Routing

**Status:** ✅ Selesai
**Ruang lingkup:** `apps/web` saja (API belum diubah — lihat bagian _Jembatan_).

## Tujuan

Menjadikan URL sebagai sumber tenant aktif di frontend:

```text
/t/{tenantPublicId}/dashboard
/t/{tenantPublicId}/accounts
/t/{tenantPublicId}/transactions
/t/{tenantPublicId}/reports
```

## Perubahan

### 1. Halaman tenant-scoped dipindah ke route param

Direktori `app/pages/**` dipindah ke bawah `app/pages/t/[tenantPublicId]/`:

| Sebelum                     | Sesudah                                        |
| --------------------------- | ---------------------------------------------- |
| `pages/dashboard/index.vue` | `pages/t/[tenantPublicId]/dashboard/index.vue` |
| `pages/accounts/index.vue`  | `pages/t/[tenantPublicId]/accounts/index.vue`  |
| `pages/transactions/*`      | `pages/t/[tenantPublicId]/transactions/*`      |
| `pages/reports/index.vue`   | `pages/t/[tenantPublicId]/reports/index.vue`   |
| `pages/billing/index.vue`   | `pages/t/[tenantPublicId]/billing/index.vue`   |
| `pages/workspace/*`         | `pages/t/[tenantPublicId]/workspace/*`         |

Halaman yang **tetap Non-tenant** (milik akun, lintas workspace):

- `pages/(auth)/signin.vue`, `pages/(auth)/signup.vue`
- `pages/onboarding/create-workspace.vue`, `pages/onboarding/join.vue`
- `pages/settings/*` (profil, preferensi, keamanan)
- `pages/help/index.vue`, `pages/error/404.vue`, `pages/index.vue`

### 2. Composable `useTenant`

Baru: `app/composables/useTenant.ts`

- `tenantPublicId` — param dari URL.
- `tenant` — tenant hasil resolve URL, divalidasi terhadap `authStore.tenants`.
- `tenantRole` — role pada tenant di URL.
- `tenantPath(path)` — builder path tenant-scoped.
- `landingPath()` — tujuan setelah login (tenant URL → workspace terakhir dipakai → onboarding).

Komponen tidak lagi membaca tenant langsung dari `authStore.currentTenant` untuk
keperluan konteks; mereka memakai `useTenant`.

### 3. Middleware dipisah per tanggung jawab

| Middleware                    | Untuk                            | Tanggung jawab                                                                      |
| ----------------------------- | -------------------------------- | ----------------------------------------------------------------------------------- |
| `middleware/tenant.ts` (baru) | rute `/t/{tenantPublicId}/**`    | authenticate → resolve tenant → **verify membership** → bridge switch → verify role |
| `middleware/auth.ts` (baru)   | rute non-tenant yang butuh login | authenticate (+ role hanya bila dalam konteks tenant)                               |
| `middleware/guest.ts`         | signin/signup                    | redirect user yang sudah login via `landingPath()`                                  |
| `middleware/role.ts`          | —                                | **dihapus**, digantikan dua middleware di atas                                      |

`definePageMeta` tiap halaman diperbarui: `["role"]` → `["tenant"]` (tenant-scoped)
atau `["auth"]` (non-tenant). Batas role dipindah ke `definePageMeta({ roles: [...] })`:

- `workspace/index.vue`, `workspace/members/index.vue` → `roles: ["owner", "admin"]`
- `billing/index.vue` → `roles: ["owner"]`

### 4. Navigasi menjadi tenant-aware

- `useNavigation` membangun path via `tenantPath(item.path)` + menyimpan `basePath`.
- `AppSidebar` mencocokkan item aktif dengan `basePath` (bukan path absolut).
- `config/navigation.ts` tetap menyimpan path relatif (`/dashboard`, dst).
- `WorkspaceSwitcher` menandai workspace aktif dari `tenantPublicId` URL (bukan
  `isCurrent` dari server), dan pindah workspace = **navigasi SPA** ke
  `/t/{id}/dashboard` (tidak lagi hard reload).
- Komponen `WorkspaceTabs` (baru) + `useTenantTabs` menggantikan `SettingsTabs`
  di area workspace/billing; `SettingsTabs` kini khusus `/settings/*`.

### 5. Otorisasi role dari tenant URL

`usePermission` kini mengambil role dari `tenantRole` (URL) dengan fallback ke
tenant session untuk halaman non-tenant.

## Jembatan ke Fase 2/3

Selama API belum tenant-scoped penuh, middleware `tenant.ts` menyinkronkan session
bila tenant di URL berbeda dari tenant aktif session:

```ts
if (authStore.currentTenant?.publicId !== tenantPublicId) {
  await authStore.switchTenant({ tenantId: tenantPublicId });
}
```

Ini mencegah dua sumber kebenaran aktif bersamaan. Ketergantungan ini dihapus di
Fase 3 (setelah `tenantId` tidak lagi ada di klaim JWT).

## Keputusan

| Keputusan                                                | Alasan                                                         |
| -------------------------------------------------------- | -------------------------------------------------------------- |
| `/settings/*` tetap non-tenant                           | Preferensi akun (tema, bahasa, sesi) bersifat lintas workspace |
| Folder param pakai `[tenantPublicId]`                    | Nama eksplisit menandai "public id", bukan internal id         |
| Tenant aktif ditandai dari URL, bukan `isCurrent` server | Menghindari state basi antara URL dan session                  |
| `WorkspaceTabs` dipisah dari `SettingsTabs`              | Tab workspace butuh `tenantPublicId`; tab akun tidak           |

## Verifikasi

```bash
pnpm --filter @finwall/web exec nuxt prepare
pnpm --filter @finwall/web run check-types   # lolos
```

## Sisa / catatan

- Validasi tenant masih berjalan di **client** (SSR dilewati karena cookie tidak
  tersedia di axios server). Penegakan otorisasi tenant yang mengikat dipindah ke
  API pada Fase 2 (`TenantGuard`).
