// Restore sesi dari httpOnly cookie saat app boot di sisi CLIENT.
//
// `_initialized` (modul-level, bukan Pinia state) memastikan fetchMe hanya
// dipanggil sekali per lifecycle browser — tidak terulang akibat SSR hydration.
// Berjalan di client saja karena init() memiliki guard `if (import.meta.server) return`.
//
// Selama fetchMe berjalan, overlay loading ditampilkan supaya tidak ada layar
// kosong / flash konten tanpa data.
export default defineNuxtPlugin(async (nuxtApp) => {
  if (import.meta.server) return;

  const authStore = useAuthStore(nuxtApp.$pinia);
  const { startBootLoading, endBootLoading } = usePageLoading();

  startBootLoading();
  try {
    await authStore.init();
  } finally {
    endBootLoading();
  }
});
