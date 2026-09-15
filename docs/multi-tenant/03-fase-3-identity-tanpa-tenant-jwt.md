# Fase 3 — Identity Tanpa Tenant di JWT

**Status:** ✅ Selesai
**Ruang lingkup:** `packages/shared`, `apps/api`, penyesuaian kecil `apps/web`.

## Tujuan

Menjadikan token sebagai **murni identitas**, menghapus state tenant dari klaim
JWT. Ini menutup celah "dua sumber kebenaran" (URL vs token) yang disengaja
dijembatani di Fase 1.

```text
Sebelum: JWT = { sub, sessionId, tenantId }   ← tenant bisa basi / saling menimpa
Sesudah: JWT = { sub, sessionId }             ← identitas saja
```

## Perubahan

### 1. Kontrak `packages/shared`

`jwtPayloadSchema` — `tenantId` **dihapus**:

```ts
export const jwtPayloadSchema = z.object({
  sub: z.string(),
  sessionId: z.string().uuid(),
  tokenType: z.enum(["access", "refresh"]),
  iat: z.number().optional(),
  exp: z.number().optional(),
});
```

`authenticatedUserSchema` — `tenantId` **dihapus**. `request.user` kini murni
identitas; kebutuhan tenant diambil dari URL via `TenantGuard`.

### 2. `SessionService`

- `signAccessToken(userId, sessionId)` — tanpa `tenantId`.
- `signRefreshToken(userId, sessionId)` — tanpa `tenantId`.
- `issueTokens(userId, sessionId)` — tanpa `tenantId`.
- `createSession()` / `rotateSession()` / `rotateLatestSessionForUser()` **tetap**
  menerima `tenantId` untuk **kolom `sessions.tenantId`** (preferensi), tetapi
  nilainya tidak lagi ikut ditandatangani ke dalam token.

Helper baru:

```ts
getTenantPreferenceForSession(sessionId): Promise<string | null>
```

Menggantikan pembacaan `user.tenantId` (yang kini tidak ada) pada endpoint yang
butuh "tenant terakhir dipakai".

### 3. `JwtStrategy`

`validate()` tidak lagi menempelkan `tenantId` ke `request.user`:

```ts
return { ...user, sessionId };
```

### 4. `AuthService.getMe` — preferensi, bukan otorisasi

Signature berubah dari `getMe(userId, tenantId)` menjadi
`getMe(userId, sessionId)`. Nilai `tenant` pada respons sekarang berasal dari
**preferensi session** (`getTenantPreferenceForSession` → validasi membership),
bukan dari klaim token. Semantiknya: petunjuk UX untuk redirect, bukan izin akses.

### 5. Call site yang diperbarui

| File                            | Perubahan                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `auth.controller.ts`            | `getMe(user.id, user.sessionId)`                                                                                |
| `tenant.controller.ts`          | `listTenants` / `getTenantMember` pakai `getTenantPreferenceForSession(user.sessionId)`; ditandai `@deprecated` |
| `tenant-resource.controller.ts` | `listTenants` pakai preferensi session                                                                          |
| `jwt.strategies.ts`             | hapus `tenantId` dari payload yang dikembalikan                                                                 |

### 6. Frontend

- `stores/auth.ts` dipindah ke endpoint kanonik:
  - `GET /tenants` (dari `/auth/tenants`)
  - `POST /tenants` (dari `/auth/tenant`)
  - `POST /tenants/{id}/switch` (dari `/auth/switch-tenant`)
- `middleware/tenant.ts`: langkah "bridge" berubah sifat menjadi **best-effort**.
  Kegagalan menyimpan preferensi tidak lagi memblokir akses ke workspace yang
  membership-nya sudah terbukti. Ini aman karena otorisasi tidak lagi bergantung
  pada `sessions.tenantId`.

## Efek

- **Tidak ada state tenant yang bisa basi di token.** Ganti workspace tidak perlu
  rotasi token hanya karena konteks berubah.
- **Satu user, banyak workspace, banyak tab** — masing-masing tab punya URL
  sendiri; token tidak saling menimpa.
- Validasi tenant terpusat di `TenantGuard` (server) — bukan di klaim token dan
  bukan di client.

## Keputusan

| Keputusan                                   | Alasan                                                         |
| ------------------------------------------- | -------------------------------------------------------------- |
| Kolom `sessions.tenantId` tidak dihapus     | Masih dipakai sebagai preferensi "last used" untuk UX redirect |
| `getMe` tetap mengembalikan `tenant`        | Kompatibilitas kontrak; nilainya kini preferensi, bukan izin   |
| Endpoint lama dipertahankan (`@deprecated`) | Migrasi bertahap tanpa breaking change                         |
| Bridge jadi best-effort                     | Otorisasi tidak lagi bergantung pada session.tenantId          |

## Verifikasi

```bash
pnpm --filter @finwall/api run build   # lolos
pnpm --filter @finwall/api test        # 4/4 lolos
pnpm --filter @finwall/web exec nuxt prepare
pnpm --filter @finwall/web run check-types   # lolos
```

### Catatan perbaikan di luar ruang lingkup

Satu tes (`auth.service.spec.ts`) sebelumnya gagal karena ekspektasi pesan lama
(`'Email / Username tidak terdaftar'`), sedangkan implementasi
[`AuthService.signin`](../../apps/api/src/modules/auth/auth.service.ts) memang
memakai pesan generik demi mencegah _user enumeration_. Ekspektasi tes
disejajarkan dengan perilaku yang benar. Kegagalan ini **sudah ada sebelum**
migrasi, bukan regresi dari fase ini.

## Utang teknis tersisa

- Hapus endpoint `@deprecated` (`/auth/tenants`, `/auth/switch-tenant`,
  `/auth/tenant`) setelah klien 100% memakai `/tenants/:tenantPublicId/*`.
- Controller domain (transactions/accounts/reports) harus memakai
  `@UseGuards(JwtAuthGuard, TenantGuard)` dengan path `tenants/:tenantPublicId/...`
  saat dibuat.
- Endpoint invite (`/auth/tenant/:tenantId/invites`) masih memvalidasi role di
  service. Sebaiknya dimigrasikan ke pola `TenantGuard` untuk konsistensi.
