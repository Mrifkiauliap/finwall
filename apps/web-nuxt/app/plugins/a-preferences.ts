// Plugin ini menginisialisasi theme dan locale dari localStorage
// SEBELUM halaman dirender di client, mencegah flash of unstyled content (FOUC).
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return;

  const themeStore = useThemeStore(nuxtApp.$pinia);
  const localeStore = useLocaleStore(nuxtApp.$pinia);

  // Apply tema dulu agar tidak ada flash saat mount
  themeStore.init();

  // Sync locale ke i18n
  localeStore.init();
});
