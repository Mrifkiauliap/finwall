// Middleware untuk halaman guest-only (signin, signup, dsb.).
// Jika user sudah terautentikasi, redirect ke dashboard / onboarding.
export default defineNuxtRouteMiddleware(async () => {
  // SSR: tidak bisa cek auth state, biarkan render dulu.
  // Client-side akan re-evaluate setelah auth-restore selesai fetchMe.
  if (import.meta.server) return;

  const authStore = useAuthStore();

  // Pastikan sesi sudah direstore sebelum memutuskan redirect.
  await authStore.init();

  if (!authStore.isAuthenticated) return; // Belum login → boleh masuk

  // Sudah login → arahkan ke tempat yang sesuai
  if (!authStore.currentTenant?.publicId) {
    return navigateTo("/onboarding/create-workspace");
  }

  return navigateTo("/dashboard");
});
