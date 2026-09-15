# Fase 2 — API Tenant Guard & Endpoint Tenant-Scoped

**Status:** ✅ Selesai
**Ruang lingkup:** `apps/api` + PR kontrak di `apps/web`.

## Tujuan

Menegakkan otorisasi tenant **di server**, dengan `tenantPublicId` dari URL
sebagai sumber tenant aktif — bukan dari klaim token.

Sebelum fase ini, otorisasi tenant hanya dievaluasi di client
(`middleware/role.ts` yang di-skip saat SSR). Artinya permintaan langsung ke API
tidak punya penjaga tenant eksplisit.

## Perubahan

### 1. `TenantGuard` (baru)

`apps/api/src/core/guards/tenant.guard.ts`

Guard yang memverifikasi keanggotaan user terhadap `tenantPublicId` di URL, lalu
menempelkan hasil resolve ke `request.tenant`.

```ts
@UseGuards(JwtAuthGuard, TenantGuard)
@Get(':tenantPublicId/members')
getMembers(@CurrentTenant() tenant: RequestTenant) { ... }
```

Prinsip penting: guard **tidak mempercayai** `tenantPublicId` mentah. Nilainya
di-resolve ulang lewat satu resolver:

```ts
SessionService.getTenantByPublicIdForUser(user.id, tenantPublicId);
```

Resolver ini sudah ada sejak sebelumnya (join `tenant_users` × `tenants`,
filter `deletedAt`), jadi tidak ada duplikasi logika resolusi tenant. Bukan
anggota → `403 Forbidden`.

### 2. `@CurrentTenant()` decorator (baru)

`apps/api/src/core/decorators/current-tenant.decorator.ts`

Mengambil tenant hasil resolve guard: `@CurrentTenant()` atau
`@CurrentTenant('role')`. Tipe `RequestTenant = { publicId, name, role }`.

### 3. `TenantResourceController` (baru) — endpoint kanonik

`apps/api/src/modules/auth/tenant/tenant-resource.controller.ts`
Base path: `/tenants`

| Method | Endpoint                           | Guard        | Keterangan                                               |
| ------ | ---------------------------------- | ------------ | -------------------------------------------------------- |
| GET    | `/tenants`                         | Jwt          | Daftar tenant user (identitas saja, tanpa tenant di URL) |
| GET    | `/tenants/:tenantPublicId`         | Jwt + Tenant | Detail tenant dari URL                                   |
| GET    | `/tenants/:tenantPublicId/members` | Jwt + Tenant | Anggota tenant (owner/admin)                             |
| POST   | `/tenants`                         | Jwt          | Buat workspace baru                                      |
| POST   | `/tenants/:tenantPublicId/switch`  | Jwt + Tenant | Set "tenant terakhir dipakai" (preferensi session)       |

`TenantGuard` terdaftar sebagai provider di `AuthModule`, dan
`TenantResourceController` didaftarkan di `controllers`.

### 4. Backward compatibility

Endpoint lama di `TenantController` (`/auth/tenants`, `/auth/switch-tenant`,
`/auth/tenant`) **tetap dipertahankan** untuk transisi. Setelah klien 100% pindah
ke `/tenants/:tenantPublicId/*`, endpoint lama bisa dihapus.

## Bentuk endpoint resource ke depan

Controller domain (transactions, accounts, reports) mengikuti pola yang sama:

```ts
@Controller("tenants/:tenantPublicId/transactions")
@UseGuards(JwtAuthGuard, TenantGuard)
export class TransactionsController {
  @Get()
  list(@CurrentTenant() tenant: RequestTenant) {
    // tenant.publicId sudah tervalidasi keanggotaannya
  }
}
```

Dengan begitu **setiap akses resource selalu melalui tenant isolation** dan tidak
pernah memakai `tenantPublicId` dari client tanpa validasi.

## Keputusan

| Keputusan                                         | Alasan                                                           |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| `TenantGuard` terpisah dari `JwtAuthGuard`        | Memisahkan _authentication_ dari _authorization_                 |
| Resolve ulang di guard, bukan percaya klaim token | Menghindari _ambient authority_ / confused deputy                |
| `GET /tenants` tetap tanpa tenant di URL          | Daftar workspace adalah properti akun, bukan resource tenant     |
| `POST /tenants/:id/switch` tetap ada              | Kompatibilitas: switch kini hanya menyimpan preferensi last-used |
| Endpoint lama belum dihapus                       | Migrasi bertahap, hindari breaking change mendadak               |

## Verifikasi

```bash
pnpm --filter @finwall/api run build   # lolos
```

## Sisa / catatan

- Controller domain (transactions/accounts/reports) belum ada di repo; saat
  dibuat, wajib memakai `@UseGuards(JwtAuthGuard, TenantGuard)` dengan path
  `tenants/:tenantPublicId/...`.
- Endpoint lama (`/auth/switch-tenant`) masih menerima `tenantId` dari body —
  validasi membership tetap dilakukan di `TenantService.switchTenant`. Ini
  dilonggarkan agar tidak breaking; akan dibereskan saat endpoint lama dihapus.
- `tenantId` masih ada di klaim JWT — dihapus di Fase 3.
