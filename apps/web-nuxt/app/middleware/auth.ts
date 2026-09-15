// app/middleware/auth.ts
//
// Middleware untuk halaman yang butuh login tetapi TIDAK tenant-scoped
// (mis. /settings/*, /help). Rute ber-tenant memakai `tenant.ts`.
//
// SSR: dilewati karena axios di server tidak membawa cookie browser, sehingga
// status auth baru bisa dipastikan di client (plugin auth-restore -> fetchMe).
import type { TenantRole } from "@finwall/shared";

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const authStore = useAuthStore();
  await authStore.init();

  if (!authStore.isAuthenticated) {
    return navigateTo({ path: "/signin", query: { redirect: to.fullPath } });
  }

  // Batas role hanya dinilai bila rute memang berada dalam konteks tenant.
  const allowedRoles = to.meta.roles as TenantRole[] | undefined;
  if (!allowedRoles?.length) return;

  const { tenantPublicId, tenantRole } = useTenant();
  if (!tenantPublicId.value) return;

  if (!tenantRole.value || !allowedRoles.includes(tenantRole.value)) {
    return navigateTo(`/t/${tenantPublicId.value}/dashboard`);
  }
});
