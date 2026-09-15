<template>
  <div
    class="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200"
  >
    <NuxtLoadingIndicator color="var(--primary)" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Global: harus ada di semua halaman, termasuk yang `layout: false`
         (signin, signup, onboarding) supaya notifikasi tetap tampil. -->
    <NotificationContainer />
    <PageLoadingOverlay />
  </div>
</template>

<script setup lang="ts">
import NotificationContainer from "@/components/feedback/NotificationContainer.vue";
import PageLoadingOverlay from "@/components/feedback/PageLoadingOverlay.vue";

const router = useRouter();
const { consumeFlashNotification } = useNotification();
const { endBootLoading } = usePageLoading();

// Pengaman: jangan sampai overlay menggantung bila inisialisasi gagal di tengah
// jalan (mis. API tidak merespons) — navigasi awal pun tak akan pernah `ready`.
const BOOT_LOADING_TIMEOUT = 10_000;

onMounted(async () => {
  consumeFlashNotification();

  const bootTimeout = setTimeout(endBootLoading, BOOT_LOADING_TIMEOUT);

  // Overlay ditutup setelah navigasi awal benar-benar selesai — yaitu setelah
  // plugin auth-restore selesai `fetchMe()` DAN middleware tenant selesai
  // resolve membership. Sebelum ini, overlay menutupi layar kosong / konten
  // tanpa data.
  await router.isReady();
  clearTimeout(bootTimeout);
  endBootLoading();
});
</script>
