import { useAuthStore } from '@/stores/auth'
import type { TenantRole } from '@finwall/shared'
import { computed } from 'vue'
import { useRoute, type RouteLocationNormalizedLoaded } from 'vue-router'

/**
 * Konteks tenant (workspace) aktif yang berasal dari URL: `/t/{tenantPublicId}/...`.
 *
 * Prinsip multi-tenant:
 * - **URL** = sumber tenant aktif (satu-satunya).
 * - **Session** = identitas user + preferensi "workspace terakhir dibuka".
 * - **Membership + role** = otorisasi.
 *
 * Komponen harus membaca tenant lewat komposabel ini (bukan langsung dari
 * `authStore.currentTenant`) agar tidak ada state yang bisa basi terhadap URL.
 *
 * `route` dapat diberikan eksplisit supaya komposabel ini juga bisa dipakai dari
 * dalam navigation guard (di luar `setup()`).
 */
export interface TenantContext {
  publicId: string
  name: string
  role: TenantRole
}

type RouteLike = Pick<RouteLocationNormalizedLoaded, 'params'>

export function useTenant(route: RouteLike = useRoute()) {
  const authStore = useAuthStore()

  /** `tenantPublicId` dari URL, atau null bila rute ini bukan tenant-scoped. */
  const tenantPublicId = computed<string | null>(() => {
    const raw = route.params.tenantPublicId
    if (typeof raw === 'string' && raw.length > 0) return raw
    if (Array.isArray(raw) && raw[0]) return raw[0]
    return null
  })

  /**
   * Tenant yang di-resolve dari URL, divalidasi terhadap daftar membership user.
   * Null bila bukan rute tenant atau user bukan anggota tenant tersebut.
   */
  const tenant = computed<TenantContext | null>(() => {
    const id = tenantPublicId.value
    if (!id) return null

    const fromMembership = authStore.tenants.find((t) => t.publicId === id)
    if (fromMembership) {
      return {
        publicId: fromMembership.publicId,
        name: fromMembership.name,
        role: fromMembership.role,
      }
    }

    // Fallback saat daftar membership belum dimuat: pakai tenant aktif session
    // hanya bila publicId-nya identik dengan yang ada di URL.
    if (authStore.currentTenant?.publicId === id && authStore.currentTenant.role) {
      return {
        publicId: id,
        name: authStore.currentTenant.name ?? '',
        role: authStore.currentTenant.role,
      }
    }

    return null
  })

  /** Role user pada tenant di URL (null bila di luar konteks tenant). */
  const tenantRole = computed<TenantRole | null>(() => tenant.value?.role ?? null)

  /** Nama tenant: dari membership -> tenant aktif -> string kosong. */
  const tenantName = computed(() => tenant.value?.name ?? authStore.currentTenant?.name ?? '')

  /**
   * Pastikan daftar membership sudah dimuat, lalu kembalikan tenant dari URL.
   * Dipakai middleware sebelum halaman dirender.
   */
  async function resolveTenant(): Promise<TenantContext | null> {
    if (!tenantPublicId.value) return null
    await authStore.fetchTenants()
    return tenant.value
  }

  /**
   * Bangun path tenant-scoped dari path relatif.
   * `tenantPath('/dashboard')` -> `/t/{tenantPublicId}/dashboard`.
   */
  function tenantPath(path = ''): string {
    const id = tenantPublicId.value
    if (!id) return path || '/'
    const suffix = path ? (path.startsWith('/') ? path : `/${path}`) : ''
    return `/t/${id}${suffix}`
  }

  /**
   * Tujuan setelah login/root: tenant dari URL -> tenant terakhir dipakai
   * (preferensi session) -> onboarding bila user belum punya tenant sama sekali.
   */
  function landingPath(): string {
    const id = tenantPublicId.value ?? authStore.currentTenant?.publicId ?? null
    return id ? `/t/${id}/dashboard` : '/onboarding/create-workspace'
  }

  return {
    tenantPublicId,
    tenant,
    tenantRole,
    tenantName,
    tenantPath,
    landingPath,
    resolveTenant,
  }
}
