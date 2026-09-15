<!-- app/components/feedback/SplashLoading.vue -->
<!-- Splash loading bermerek. Dipakai halaman root dan overlay boot global. -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  { title: undefined, description: undefined },
);
</script>

<template>
  <div
    class="relative flex items-center justify-center overflow-hidden bg-background"
  >
    <!-- Dekorasi latar -->
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        class="absolute left-1/2 top-1/2 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-3xl animate-splash-breathe"
      />
      <div
        class="absolute -left-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        class="absolute -bottom-32 -right-32 size-96 rounded-full bg-primary/5 blur-3xl"
      />
      <!-- Grid halus: memberi kesan "sedang menyusun" -->
      <div
        class="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
    </div>

    <!-- Konten -->
    <div
      class="relative z-10 flex flex-col items-center gap-7 px-6 text-center"
    >
      <!-- Logo dengan ring berputar -->
      <div class="relative flex size-20 items-center justify-center">
        <span
          class="absolute inset-0 rounded-3xl bg-primary/20 blur-xl animate-splash-glow"
          aria-hidden="true"
        />
        <span
          class="absolute inset-0 rounded-[1.35rem] border-2 border-primary/25 border-t-primary animate-splash-spin"
          aria-hidden="true"
        />
        <div
          class="relative flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>

      <!-- Teks -->
      <div class="space-y-2">
        <h1
          class="text-3xl font-bold tracking-tight text-foreground animate-splash-rise"
        >
          {{ title ?? $t("loading.TITLE") }}
        </h1>
        <p
          class="text-sm text-muted-foreground animate-splash-rise [animation-delay:120ms]"
        >
          {{ description ?? $t("loading.DESCRIPTION") }}
        </p>
      </div>

      <!-- Indikator progres tak-tentu -->
      <div class="w-56 space-y-3">
        <div class="h-1 overflow-hidden rounded-full bg-muted">
          <span
            class="block h-full w-1/3 rounded-full bg-primary animate-splash-bar"
          />
        </div>
        <div class="flex justify-center gap-1.5" aria-hidden="true">
          <span
            v-for="i in 3"
            :key="i"
            class="size-1.5 rounded-full bg-primary/70 animate-splash-dot"
            :style="{ animationDelay: `${(i - 1) * 160}ms` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes splash-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes splash-glow {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.08);
  }
}

@keyframes splash-breathe {
  0%,
  100% {
    opacity: 0.55;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.9;
    transform: translate(-50%, -50%) scale(1.06);
  }
}

@keyframes splash-bar {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(320%);
  }
}

@keyframes splash-dot {
  0%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@keyframes splash-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-splash-spin {
  animation: splash-spin 1.6s linear infinite;
}
.animate-splash-glow {
  animation: splash-glow 2.4s ease-in-out infinite;
}
.animate-splash-breathe {
  animation: splash-breathe 5s ease-in-out infinite;
}
.animate-splash-bar {
  animation: splash-bar 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
.animate-splash-dot {
  animation: splash-dot 1.2s ease-in-out infinite;
}
.animate-splash-rise {
  animation: splash-rise 0.5s ease-out both;
}

/* Hormati preferensi pengguna yang tidak menginginkan animasi. */
@media (prefers-reduced-motion: reduce) {
  .animate-splash-spin,
  .animate-splash-glow,
  .animate-splash-breathe,
  .animate-splash-bar,
  .animate-splash-dot,
  .animate-splash-rise {
    animation: none;
  }
}
</style>
