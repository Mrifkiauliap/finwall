// apps/web/app/composables/usePageLoading.ts

export function usePageLoading() {
  /**
   * Dua sumber loading dipisah agar tidak saling menimpa:
   * - `bootLoading`  : inisialisasi data (restore sesi, resolve tenant).
   * - `uiLoading`    : aksi yang dikendalikan manual (mis. switch workspace).
   *
   * `isLoading` adalah gabungan keduanya, sehingga `hideLoading()` dari satu
   * alur tidak mematikan loading yang masih berjalan di alur lain.
   */
  const bootLoading = useState<boolean>("boot-loading", () => false);
  const uiLoading = useState<boolean>("page-loading", () => false);
  const loadingMessage = useState<string>("page-loading-msg", () => "");

  const isLoading = computed(() => bootLoading.value || uiLoading.value);

  function showLoading(message?: string) {
    uiLoading.value = true;
    loadingMessage.value = message ?? "";
  }

  function hideLoading() {
    uiLoading.value = false;
    loadingMessage.value = "";
  }

  /** Tampilkan overlay selama inisialisasi data berjalan. */
  function startBootLoading(message?: string) {
    bootLoading.value = true;
    if (message) loadingMessage.value = message;
  }

  function endBootLoading() {
    bootLoading.value = false;
  }

  /**
   * Jalankan operasi async sambil menampilkan overlay. Aman terhadap error:
   * overlay selalu ditutup di `finally`.
   */
  async function withLoading<T>(
    fn: () => Promise<T>,
    message?: string,
  ): Promise<T> {
    showLoading(message);
    try {
      return await fn();
    } finally {
      hideLoading();
    }
  }

  return {
    isLoading,
    bootLoading,
    uiLoading,
    loadingMessage,
    startBootLoading,
    endBootLoading,
    showLoading,
    hideLoading,
    withLoading,
  };
}
