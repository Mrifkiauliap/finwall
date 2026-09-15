// app/middleware/route.global.ts
//
// Global entry untuk dua hal:
// 1. Rute tidak dikenal -> halaman 404.
// 2. Root `/` -> arahkan SEBELUM render, supaya tidak ada flash konten yang
//    lalu lompat. Sebelumnya redirect dilakukan di dalam `pages/index.vue`
//    (imperatif, setelah halaman ter-render) sehingga terlihat berkedip dan
//    menyisakan state setengah jadi di client.
export default defineNuxtRouteMiddleware(async (to) => {
  // 1. Rute tidak dikenal
  if (!to.matched.length) {
    return navigateTo("/error/404", { external: true });
  }

  // Sisanya hanya relevan di client (butuh cookie/session).
  if (import.meta.server) return;
  if (to.path !== "/") return;

  // 2. Root: tunggu restore sesi, lalu arahkan tanpa pernah merender index.vue.
  const authStore = useAuthStore();
  await authStore.init();

  if (!authStore.isAuthenticated) {
    return navigateTo("/signin");
  }

  const { landingPath } = useTenant();
  return navigateTo(landingPath());
});
