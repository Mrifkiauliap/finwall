import { usePageLoading } from '@/composables/usePageLoading'
import { useTenant } from '@/composables/useTenant'
import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * Layout yang dipakai (dipilih `App.vue`):
     * - `none`     : tanpa layout (autentikasi, onboarding, root, 404).
     * - `settings` : layout pengaturan akun.
     * - (default)  : layout aplikasi (sidebar + header) untuk halaman ber-tenant.
     */
    layout?: 'none' | 'settings'
    /** Halaman hanya untuk tamu (belum login). */
    guest?: boolean
    /** Halaman butuh login (di luar konteks tenant). */
    requiresAuth?: boolean
    /** Halaman ter-scope tenant: butuh login + keanggotaan tenant dari URL. */
    requiresTenant?: boolean
    /** Batasi akses berdasarkan role tenant. */
    roles?: string[]
    /** i18n keys untuk breadcrumb. */
    breadcrumb?: string[]
    /** i18n key judul halaman (dipakai `PlaceholderView`). */
    titleKey?: string
    /** i18n key sub-judul halaman (dipakai `PlaceholderView`). */
    subtitleKey?: string
    /** i18n key pesan "segera hadir" (dipakai `PlaceholderView`). */
    comingSoonKey?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // ---------------------------------------------------------------------
    // Publik / guest
    // ---------------------------------------------------------------------
    {
      path: '/',
      name: 'root',
      component: () => import('@/views/RootView.vue'),
      meta: { layout: 'none' },
    },
    {
      path: '/signin',
      name: 'signin',
      component: () => import('@/views/auth/SignInView.vue'),
      meta: { layout: 'none', guest: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/auth/SignUpView.vue'),
      meta: { layout: 'none', guest: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/forgotPassword/ForgotPasswordView.vue'),
      meta: { layout: 'none', guest: true },
    },
    {
      path: '/forgot-password/reset',
      name: 'reset-password',
      component: () => import('@/views/auth/forgotPassword/ResetPassword.vue'),
      meta: { layout: 'none', guest: true },
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('@/views/auth/verifyEmail/VerifyEmailView.vue'),
      meta: { layout: 'none', requiresAuth: true },
    },

    // ---------------------------------------------------------------------
    // Onboarding (butuh login, TANPA konteks tenant)
    // ---------------------------------------------------------------------
    {
      path: '/onboarding/create-workspace',
      name: 'onboarding-create-workspace',
      component: () => import('@/views/onboarding/CreateWorkspaceView.vue'),
      meta: { layout: 'none', requiresAuth: true },
    },
    {
      path: '/onboarding/join',
      name: 'onboarding-join',
      component: () => import('@/views/onboarding/JoinWorkspaceView.vue'),
      meta: { layout: 'none', requiresAuth: true },
    },

    // ---------------------------------------------------------------------
    // Akun (butuh login, TANPA konteks tenant)
    // ---------------------------------------------------------------------
    {
      path: '/settings',
      component: () => import('@/layouts/SettingsLayout.vue'),
      meta: { layout: 'settings', requiresAuth: true },
      children: [
        { path: '', redirect: { name: 'settings-profile' } },
        {
          path: 'profile',
          name: 'settings-profile',
          component: () => import('@/views/settings/ProfileView.vue'),
          meta: {
            breadcrumb: ['common.settings.TITLE', 'common.settings.PAGES.PROFILE'],
          },
        },
        {
          path: 'preferences',
          name: 'settings-preferences',
          component: () => import('@/views/settings/PreferencesView.vue'),
          meta: {
            breadcrumb: ['common.settings.TITLE', 'common.settings.PAGES.PREFERENCES'],
          },
        },
        {
          path: 'appearance',
          name: 'settings-appearance',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: {
            breadcrumb: ['common.settings.TITLE', 'common.settings.PAGES.APPEARANCE'],
            titleKey: 'settingsPages.APPEARANCE.TITLE',
            subtitleKey: 'settingsPages.APPEARANCE.SUBTITLE',
            comingSoonKey: 'settingsPages.APPEARANCE.COMING_SOON',
          },
        },
        {
          path: 'security',
          name: 'settings-security',
          component: () => import('@/views/settings/SecurityView.vue'),
          meta: {
            breadcrumb: ['common.settings.TITLE', 'common.settings.PAGES.SECURITY'],
          },
        },

        // -------------------------------------------------------------------
        // Notifikasi per-kanal
        //
        // Path multi-segmen (`notifications/email`) dipakai agar tidak
        // bertabrakan dengan `/settings/notifications` bila nanti ingin ada
        // halaman ringkasan. Ketiganya memakai `PlaceholderView` karena
        // backend belum menyimpan preferensi notifikasi.
        // -------------------------------------------------------------------
        {
          path: 'notifications/email',
          name: 'settings-notifications-email',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: {
            breadcrumb: ['common.settings.TITLE', 'common.settings.PAGES.EMAIL'],
            titleKey: 'settingsPages.NOTIFICATIONS_EMAIL.TITLE',
            subtitleKey: 'settingsPages.NOTIFICATIONS_EMAIL.SUBTITLE',
            comingSoonKey: 'settingsPages.NOTIFICATIONS_EMAIL.COMING_SOON',
          },
        },
        {
          path: 'notifications/push',
          name: 'settings-notifications-push',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: {
            breadcrumb: ['common.settings.TITLE', 'common.settings.PAGES.PUSH'],
            titleKey: 'settingsPages.NOTIFICATIONS_PUSH.TITLE',
            subtitleKey: 'settingsPages.NOTIFICATIONS_PUSH.SUBTITLE',
            comingSoonKey: 'settingsPages.NOTIFICATIONS_PUSH.COMING_SOON',
          },
        },
        {
          path: 'notifications/whatsapp',
          name: 'settings-notifications-whatsapp',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: {
            breadcrumb: ['common.settings.TITLE', 'common.settings.PAGES.WHATSAPP'],
            titleKey: 'settingsPages.NOTIFICATIONS_WHATSAPP.TITLE',
            subtitleKey: 'settingsPages.NOTIFICATIONS_WHATSAPP.SUBTITLE',
            comingSoonKey: 'settingsPages.NOTIFICATIONS_WHATSAPP.COMING_SOON',
          },
        },

        // -------------------------------------------------------------------
        // Lainnya
        // -------------------------------------------------------------------
        {
          path: 'guides',
          name: 'settings-guides',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: {
            breadcrumb: ['common.settings.TITLE', 'common.settings.PAGES.GUIDES'],
            titleKey: 'settingsPages.GUIDES.TITLE',
            subtitleKey: 'settingsPages.GUIDES.SUBTITLE',
            comingSoonKey: 'settingsPages.GUIDES.COMING_SOON',
          },
        },
        {
          path: 'changelog',
          name: 'settings-changelog',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: {
            breadcrumb: ['common.settings.TITLE', 'common.settings.PAGES.CHANGE_LOG'],
            titleKey: 'settingsPages.CHANGE_LOG.TITLE',
            subtitleKey: 'settingsPages.CHANGE_LOG.SUBTITLE',
            comingSoonKey: 'settingsPages.CHANGE_LOG.COMING_SOON',
          },
        },
      ],
    },
    {
      path: '/help',
      name: 'help',
      component: () => import('@/views/PlaceholderView.vue'),
      meta: {
        requiresAuth: true,
        breadcrumb: ['common.navigation.HELP'],
        titleKey: 'help.TITLE',
        subtitleKey: 'help.SUBTITLE',
        comingSoonKey: 'help.COMING_SOON',
      },
    },

    // ---------------------------------------------------------------------
    // Tenant-scoped (layout aplikasi default)
    // ---------------------------------------------------------------------
    {
      path: '/t/:tenantPublicId',
      name: 'tenant-root',
      redirect: (to) => ({ name: 'dashboard', params: to.params }),
      meta: { requiresTenant: true },
    },
    {
      path: '/t/:tenantPublicId/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/DashboardView.vue'),
      meta: { requiresTenant: true, breadcrumb: ['common.navigation.DASHBOARD'] },
    },
    {
      path: '/t/:tenantPublicId/accounts',
      name: 'accounts',
      component: () => import('@/features/accounts/index.vue'),
      meta: { requiresTenant: true, breadcrumb: ['common.navigation.ACCOUNTS'] },
    },
    {
      path: '/t/:tenantPublicId/transactions',
      name: 'transactions',
      component: () => import('@/features/transaction/index.vue'),
      meta: { requiresTenant: true, breadcrumb: ['common.navigation.TRANSACTIONS'] },
    },
    {
      path: '/t/:tenantPublicId/reports',
      name: 'reports',
      component: () => import('@/views/PlaceholderView.vue'),
      meta: {
        requiresTenant: true,
        breadcrumb: ['common.navigation.REPORTS'],
        titleKey: 'reports.TITLE',
        subtitleKey: 'reports.SUBTITLE',
        comingSoonKey: 'reports.COMING_SOON',
      },
    },
    {
      path: '/t/:tenantPublicId/workspace',
      name: 'workspace',
      component: () => import('@/views/PlaceholderView.vue'),
      meta: {
        requiresTenant: true,
        roles: ['owner', 'admin'],
        breadcrumb: ['common.navigation.MENU_TEAM', 'common.navigation.WORKSPACE_SETTINGS'],
        titleKey: 'workspaceSettings.TITLE',
        subtitleKey: 'workspaceSettings.SUBTITLE',
        comingSoonKey: 'workspaceSettings.COMING_SOON',
      },
    },
    {
      path: '/t/:tenantPublicId/workspace/members',
      name: 'workspace-members',
      component: () => import('@/views/PlaceholderView.vue'),
      meta: {
        requiresTenant: true,
        roles: ['owner', 'admin'],
        breadcrumb: ['common.navigation.MENU_TEAM', 'common.navigation.MEMBERS'],
        titleKey: 'members.TITLE',
        subtitleKey: 'members.SUBTITLE',
        comingSoonKey: 'members.COMING_SOON',
      },
    },
    {
      path: '/t/:tenantPublicId/billing',
      name: 'billing',
      component: () => import('@/views/PlaceholderView.vue'),
      meta: {
        requiresTenant: true,
        roles: ['owner'],
        breadcrumb: ['common.navigation.MENU_TEAM', 'common.navigation.BILLING'],
        titleKey: 'billing.TITLE',
        subtitleKey: 'billing.SUBTITLE',
        comingSoonKey: 'billing.COMING_SOON',
      },
    },

    // ---------------------------------------------------------------------
    // 404
    // ---------------------------------------------------------------------
    {
      path: '/404',
      name: 'not-found',
      component: () => import('@/views/ErrorNotFoundView.vue'),
      meta: { layout: 'none' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'catch-all',
      component: () => import('@/views/ErrorNotFoundView.vue'),
      meta: { layout: 'none' },
    },
  ],
})

/**
 * Guard global.
 *
 * Versi Nuxt memakai `middleware/*.ts`; pada SPA seluruh logika dipusatkan di
 * sini dengan urutan: root redirect -> guest -> auth -> tenant.
 */
router.beforeEach(async (to: RouteLocationNormalized) => {
  const authStore = useAuthStore()
  const { startBootLoading, endBootLoading } = usePageLoading()

  // 1. Root: arahkan ke workspace terakhir tanpa merender halaman kosong.
  if (to.name === 'root') {
    startBootLoading()
    try {
      await authStore.init()
    } finally {
      endBootLoading()
    }

    if (!authStore.isAuthenticated) {
      return { name: 'signin' }
    }

    // Tidak ada tenant di URL `/`, jadi preferensi session yang dipakai.
    return { path: landingPathFor(to) }
  }

  // 2. Guest-only: user yang sudah login tidak perlu melihat signin/signup.
  if (to.meta.guest) {
    await authStore.init()
    if (authStore.isAuthenticated) {
      return { path: landingPathFor(to) }
    }
    return true
  }

  // 3. Butuh login (akun / onboarding / tenant).
  if (!to.meta.requiresAuth && !to.meta.requiresTenant) return true

  let startedLoading = false
  if (!authStore.isAuthenticated) {
    startedLoading = true
    startBootLoading()
  }

  try {
    // `init()` idempoten; aman dipanggil di setiap navigasi.
    await authStore.init()

    if (!authStore.isAuthenticated) {
      return { name: 'signin', query: { redirect: to.fullPath } }
    }

    if (!to.meta.requiresTenant) return true

    // 4. Tenant-scoped: validasi keanggotaan tenant dari URL.
    const raw = to.params.tenantPublicId
    const tenantPublicId = typeof raw === 'string' ? raw : ''
    if (!tenantPublicId) return { name: 'root' }

    if (!authStore.tenantsLoaded && !startedLoading) {
      startedLoading = true
      startBootLoading()
    }

    await authStore.fetchTenants()

    const membership = authStore.tenants.find((t) => t.publicId === tenantPublicId)
    if (!membership) {
      // Bukan anggota tenant ini -> tidak boleh mengakses resource-nya.
      return { name: 'root' }
    }

    // Simpan preferensi "workspace terakhir dipakai" (best-effort).
    if (authStore.currentTenant?.publicId !== tenantPublicId) {
      try {
        await authStore.switchTenant({ tenantId: tenantPublicId })
      } catch {
        // Diabaikan dengan sengaja — preferensi bersifat opsional.
      }
    }

    // Batasi akses berdasarkan role.
    const allowedRoles = to.meta.roles
    if (allowedRoles?.length) {
      const role = membership.role
      if (!role || !allowedRoles.includes(role)) {
        return { name: 'dashboard', params: { tenantPublicId } }
      }
    }

    return true
  } catch {
    return { name: 'root' }
  } finally {
    if (startedLoading) endBootLoading()
  }
})

/** Hitung tujuan setelah login dari konteks route saat ini. */
function landingPathFor(to: RouteLocationNormalized): string {
  const { landingPath } = useTenant({ params: to.params })
  return landingPath()
}

export default router
