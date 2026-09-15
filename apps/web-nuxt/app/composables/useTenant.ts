// app/composables/useTenant.ts
import type { TenantRole } from "@finwall/shared";

/**
 * Konteks tenant (workspace) aktif yang berasal dari URL: `/t/{tenantPublicId}/...`.
 *
 * Prinsip multi-tenant:
 * - **URL** = sumber tenant aktif (satu-satunya).
 * - **Session/JWT** = identitas user + preferensi "workspace terakhir dibuka".
 * - **Membership + role** = otorisasi.
 *
 * Karena URL adalah sumber tenant, komponen harus membaca tenant lewat composable
 * ini (bukan langsung dari `authStore.currentTenant`) agar tidak ada state yang
 * bisa basi terhadap URL.
 */
export interface TenantContext {
  publicId: string;
  name: string;
  role: TenantRole;
}

export function useTenant() {
  const route = useRoute();
  const authStore = useAuthStore();

  /**
   * Pastikan daftar membership tenant sudah dimuat, lalu kembalikan tenant yang
   * cocok dengan URL. Dipakai middleware sebelum halaman dirender.
   *
   * Overlay loading ditangani di level boot (`plugin auth-restore` +
   * `router.isReady()` di `app.vue`), jadi di sini cukup memastikan data siap.
   */
  async function resolveTenant(): Promise<TenantContext | null> {
    if (!tenantPublicId.value) return null;
    await authStore.fetchTenants();
    return tenant.value;
  }

  /** `tenantPublicId` dari URL, atau null bila rute ini bukan tenant-scoped. */
  const tenantPublicId = computed<string | null>(() => {
    const raw = route.params.tenantPublicId;
    if (typeof raw === "string" && raw.length > 0) return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return null;
  });

  /**
   * Tenant yang di-resolve dari URL, divalidasi terhadap daftar membership user.
   * Mengembalikan null bila bukan rute tenant atau user bukan anggota tenant tsb.
   */
  const tenant = computed<TenantContext | null>(() => {
    const id = tenantPublicId.value;
    if (!id) return null;

    const fromMembership = authStore.tenants.find((t) => t.publicId === id);
    if (fromMembership) {
      return {
        publicId: fromMembership.publicId,
        name: fromMembership.name,
        role: fromMembership.role,
      };
    }

    // Fallback saat daftar membership belum dimuat: pakai tenant aktif session
    // hanya jika publicId-nya identik dengan yang ada di URL.
    if (authStore.currentTenant?.publicId === id) {
      return {
        publicId: id,
        name: authStore.currentTenant.name ?? "",
        role: authStore.currentTenant.role as TenantRole,
      };
    }

    return null;
  });

  /** Role user pada tenant di URL (null bila di luar konteks tenant). */
  const tenantRole = computed<TenantRole | null>(
    () => tenant.value?.role ?? null,
  );

  /**
   * Bangun path tenant-scoped dari path relatif.
   * `tenantPath("/dashboard")` -> `/t/{tenantPublicId}/dashboard`.
   */
  function tenantPath(path = ""): string {
    const id = tenantPublicId.value;
    if (!id) return path || "/";
    const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
    return `/t/${id}${suffix}`;
  }

  /**
   * Tujuan setelah login/root: tenant dari URL -> tenant terakhir dipakai
   * (preferensi session) -> onboarding bila user belum punya tenant sama sekali.
   */
  function landingPath(): string {
    const id =
      tenantPublicId.value ?? authStore.currentTenant?.publicId ?? null;
    return id ? `/t/${id}/dashboard` : "/onboarding/create-workspace";
  }

  return {
    tenantPublicId,
    tenant,
    tenantRole,
    tenantPath,
    landingPath,
    resolveTenant,
  };
}
