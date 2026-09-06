// app/composables/usePermission.ts
import type { TenantRole } from "@finwall/shared";
import { useAuthStore } from "../stores/auth";

export const usePermission = () => {
  const authStore = useAuthStore();
  const currentRole = computed<TenantRole | null>(
    () => authStore.currentTenant?.role ?? null,
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
