// app/middleware/role.ts
export default defineNuxtRouteMiddleware(async (to) => {
  // SSR: tidak bisa memvalidasi sesi karena axios server tidak membawa cookie
  // browser. Biarkan halaman ter-render; plugin auth-restore akan fetchMe di
  // sisi client, lalu middleware ini berjalan lagi pada navigasi berikutnya.
  if (import.meta.server) return;

  const authStore = useAuthStore();

  // Pastikan sesi sudah direstore dari cookie sebelum menilai status autentikasi.
  await authStore.init();

  // 1. Cek apakah user sudah login
  if (!authStore.isAuthenticated) {
    return navigateTo("/signin");
  }

  // 2. Cek apakah user sudah memilih/memiliki tenant aktif
  if (
    !authStore.currentTenant?.publicId &&
    to.path !== "/onboarding/create-workspace" &&
    to.path !== "/onboarding/join"
  ) {
    return navigateTo("/onboarding/create-workspace");
  }

  // 3. Cek batas role pada halaman
  const allowedRoles = to.meta.roles as string[] | undefined;
  const userRole = authStore.currentTenant?.role; // 'owner' | 'admin' | 'member' | 'viewer'

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return navigateTo("/dashboard");
  }
});
