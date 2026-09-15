# Multi-Tenant: Tenant di URL (Explicit Tenant Context)

Dokumentasi ini mencatat migrasi dari **tenant implicit** (tenant aktif menempel
di session/JWT) menjadi **tenant explicit** (tenant aktif ditentukan URL), agar
setiap fase punya history perubahan yang bisa ditelusuri.

## Prinsip

```text
Session/JWT  = identity & authentication        (siapa yang login)
URL          = active tenant / workspace context (/t/{tenantPublicId}/...)
Membership   = authorization                     (cek keanggotaan + role)
```

`tenantPublicId` dari client **tidak pernah dipercaya** tanpa validasi
membership. Resolver tunggalnya: `SessionService.getTenantByPublicIdForUser()`
(API) dan middleware `tenant.ts` (frontend).

## Alur otorisasi

```text
URL tenantPublicId
        ↓
Resolve tenant
        ↓
Authenticate user via session/JWT
        ↓
Verify user membership pada tenant
        ↓
Verify role/permission
        ↓
Access tenant resources
```

## Daftar fase

| Fase | Fokus                                                          | Dokumen                                                                            | Status     |
| ---- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------- |
| 1    | Frontend: routing tenant `/t/[tenantPublicId]` + middleware    | [01-fase-1-frontend-tenant-routing.md](./01-fase-1-frontend-tenant-routing.md)     | ✅ Selesai |
| 2    | API: `TenantGuard` + `@CurrentTenant` + endpoint tenant-scoped | [02-fase-2-api-tenant-guard.md](./02-fase-2-api-tenant-guard.md)                   | ✅ Selesai |
| 3    | Identity: hapus `tenantId` dari klaim JWT                      | [03-fase-3-identity-tanpa-tenant-jwt.md](./03-fase-3-identity-tanpa-tenant-jwt.md) | ✅ Selesai |
| 4    | UI: sidebar 2 kolom (rail + panel akun) & pembersihan kode     | [04-fase-4-sidebar-refactor.md](./04-fase-4-sidebar-refactor.md)                   | ✅ Selesai |

Catatan: urutan pengerjaan = Fase 2 (API guard) → Fase 3 (identity) → Fase 1
(frontend wiring ke endpoint baru) → Fase 4 (UI).

## Yang TIDAK dihapus

`session.tenantId` tetap ada, tetapi **berubah peran**: dari "sumber tenant
aktif" menjadi sekadar **preferensi "workspace terakhir dibuka"** untuk keperluan
redirect setelah login (`GET /auth/me`, `landingPath()`).
