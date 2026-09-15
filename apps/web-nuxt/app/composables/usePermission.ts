// app/composables/usePermission.ts
import type { TenantRole } from "@finwall/shared";

/**
 * Otorisasi berbasis role tenant.
 *
 * Sumber role: tenant yang di-resolve dari URL (`useTenant`). Bila rute tidak
 * berada dalam konteks tenant (mis. halaman akun `/settings/*`), fallback ke
 * tenant aktif di session — namun keputusan otorisasi tenant tetap harus
 * ditegakkan di server oleh TenantGuard.
 */
export const usePermission = () => {
  const authStore = useAuthStore();
  const { tenantRole } = useTenant();

  const currentRole = computed<TenantRole | null>(
    () => tenantRole.value ?? authStore.currentTenant?.role ?? null,
  );

  const isOwner = computed(() => currentRole.value === "owner");
  const isAdmin = computed(() =>
    ["owner", "admin"].includes(currentRole.value || ""),
  );
  const canWrite = computed(() =>
    ["owner", "admin", "member"].includes(currentRole.value || ""),
  );
  const isViewer = computed(() => currentRole.value === "viewer");

  const hasRole = (...roles: TenantRole[]) => {
    return currentRole.value ? roles.includes(currentRole.value) : false;
  };

  return {
    currentRole,
    isOwner,
    isAdmin,
    canWrite,
    isViewer,
    hasRole,
  };
};
