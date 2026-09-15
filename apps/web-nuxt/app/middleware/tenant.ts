// app/middleware/tenant.ts
//
// Middleware untuk rute tenant-scoped (`/t/{tenantPublicId}/...`).
//
// Alur otorisasi:
//   URL tenantPublicId -> resolve tenant -> authenticate user -> verify membership
//   -> verify role/permission -> akses resource tenant.
//
// `tenantPublicId` dari URL TIDAK PERNAH dipercaya begitu saja: nilainya selalu
// divalidasi terhadap daftar membership user.
import type { TenantRole } from "@finwall/shared";

export default defineNuxtRouteMiddleware(async (to) => {
  // SSR: cookie belum tersedia di axios server, jadi validasi dijalankan di client.
  if (import.meta.server) return;

  const authStore = useAuthStore();
  const { startBootLoading, endBootLoading } = usePageLoading();

  // 1. Authenticate (sesi sudah direstore plugin auth-restore saat boot).
  //    `init()` bersifat idempoten, jadi aman dipanggil lagi di navigasi berikutnya.
  let startedLoading = false;
  if (!authStore.isAuthenticated) {
    startedLoading = true;
    startBootLoading();
  }

  try {
    await authStore.init();

    if (!authStore.isAuthenticated) {
      return navigateTo({ path: "/signin", query: { redirect: to.fullPath } });
    }

    // 2. Resolve tenant dari URL
    const raw = to.params.tenantPublicId;
    const tenantPublicId = typeof raw === "string" ? raw : "";
    if (!tenantPublicId) {
      return navigateTo("/");
    }

    // 3. Init data: pastikan daftar membership tersedia sebelum halaman render.
    //    Tampilkan overlay hanya bila data memang belum ada di cache, supaya
    //    navigasi antar-workspace tidak berkedip.
    if (!authStore.tenantsLoaded && !startedLoading) {
      startedLoading = true;
      startBootLoading();
    }

    await authStore.fetchTenants();

    // 4. Verify membership (daftar tenant user = sumber kebenaran keanggotaan)
    const membership = authStore.tenants.find(
      (t) => t.publicId === tenantPublicId,
    );
    if (!membership) {
      // Bukan anggota tenant ini -> tidak boleh mengakses resource-nya.
      return navigateTo("/");
    }

    // 5. Simpan preferensi "workspace terakhir dipakai" (best-effort).
    //
    //    Tidak menentukan otorisasi: sejak Fase 3 tenant tidak ada di klaim JWT,
    //    jadi kegagalan menyimpan preferensi tidak boleh menghalangi akses ke
    //    workspace yang membership-nya sudah terbukti di langkah 4.
    if (authStore.currentTenant?.publicId !== tenantPublicId) {
      try {
        await authStore.switchTenant({ tenantId: tenantPublicId });
      } catch {
        // Diabaikan dengan sengaja — preferensi bersifat opsional.
      }
    }

    // 6. Verify role/permission
    const allowedRoles = to.meta.roles as TenantRole[] | undefined;
    if (allowedRoles?.length) {
      const role = membership.role;
      if (!role || !allowedRoles.includes(role)) {
        return navigateTo(`/t/${tenantPublicId}/dashboard`);
      }
    }
  } catch {
    return navigateTo("/");
  } finally {
    // Hanya tutup bila middleware ini yang membukanya. Saat boot awal, overlay
    // dipegang oleh plugin + `router.isReady()` sehingga tidak ditutup di sini.
    if (startedLoading) endBootLoading();
  }
});
