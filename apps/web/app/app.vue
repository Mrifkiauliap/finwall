<template>
  <div
    class="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200"
  >
    <NuxtLoadingIndicator color="var(--primary)" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Theme & locale diinisialisasi oleh plugin a-preferences.ts (client-only)
// sebelum komponen ini di-mount, sehingga tidak ada flash of wrong theme.
// Tidak perlu useColorMode di sini lagi.
</script>
