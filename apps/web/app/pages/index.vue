<script setup lang="ts">
definePageMeta({
  layout: false,
});

const authStore = useAuthStore();

// Redirect hanya di client setelah plugin auth-restore menyelesaikan fetchMe.
// Tidak perlu memanggil init() di sini — plugin auth-restore.ts sudah menangani.
if (import.meta.client) {
  if (!authStore.isAuthenticated) {
    await navigateTo("/signin", { external: true });
  } else if (!authStore.currentTenant?.publicId) {
    await navigateTo("/onboarding/create-workspace", { external: true });
  } else {
    await navigateTo("/dashboard", { external: true });
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-background relative overflow-hidden"
  >
    <!-- Background decorative blobs -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div
        class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl"
      />
    </div>

    <!-- Card -->
    <div
      class="relative z-10 flex flex-col items-center gap-6 px-6 text-center"
    >
      <!-- Logo mark -->
      <div
        class="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse-slow"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-8 h-8 text-primary-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>

      <!-- Brand name -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">
          Finwall
        </h1>
        <p class="text-sm text-muted-foreground">
          Menyiapkan workspace Anda...
        </p>
      </div>

      <!-- Spinner -->
      <div class="flex gap-1.5">
        <span
          class="w-2 h-2 rounded-full bg-primary animate-bounce"
          style="animation-delay: 0ms"
        />
        <span
          class="w-2 h-2 rounded-full bg-primary animate-bounce"
          style="animation-delay: 150ms"
        />
        <span
          class="w-2 h-2 rounded-full bg-primary animate-bounce"
          style="animation-delay: 300ms"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse-slow {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(0.97);
  }
}
.animate-pulse-slow {
  animation: pulse-slow 2.5s ease-in-out infinite;
}
</style>
