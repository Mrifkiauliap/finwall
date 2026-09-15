<script setup lang="ts">
import SplashLoading from "@/components/feedback/SplashLoading.vue";

// Redirect `/` sudah ditangani `middleware/route.global.ts` SEBELUM halaman ini
// dirender — jadi tidak ada flash "halaman kosong" yang lalu melompat.
// Komponen ini hanya tampil singkat saat SSR (sebelum sesi diketahui) dan
// sebagai jaring pengaman bila middleware dilewati.
definePageMeta({
  layout: false,
});
</script>

<template>
  <SplashLoading class="min-h-dvh" />
</template>
