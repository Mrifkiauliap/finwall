<script setup lang="ts">
import SplashLoading from '@/components/feedback/SplashLoading.vue'

// Redirect `/` sudah ditangani guard global SEBELUM halaman ini dirender — jadi
// tidak ada flash "halaman kosong" yang lalu melompat. Komponen ini hanya
// tampil singkat sebagai jaring pengaman bila guard dilewati.
</script>

<template>
  <SplashLoading class="min-h-dvh" />
</template>
