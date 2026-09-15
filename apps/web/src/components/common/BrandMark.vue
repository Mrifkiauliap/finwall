<!-- Logo Finwall. Satu sumber markup supaya logo tidak diduplikasi di
     splash, sidebar, dan halaman auth. -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    /** Tampilkan nama brand di samping logo. */
    showName?: boolean
    /**
     * `solid`  : logo di atas permukaan normal (bg-primary).
     * `onBrand`: logo di atas latar brand, mis. panel primary (translucent).
     */
    variant?: 'solid' | 'onBrand'
  }>(),
  { size: 'md', showName: false, variant: 'solid' },
)

const boxClass: Record<string, string> = {
  sm: 'size-8 rounded-lg',
  md: 'size-12 rounded-xl',
  lg: 'size-16 rounded-2xl',
}

const iconClass: Record<string, string> = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
}

const nameClass: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
}
</script>

<template>
  <div class="inline-flex items-center gap-2.5">
    <div
      class="flex shrink-0 items-center justify-center"
      :class="[
        boxClass[size],
        variant === 'onBrand'
          ? 'bg-primary-foreground/15 text-primary-foreground ring-1 ring-primary-foreground/25 backdrop-blur'
          : 'bg-primary text-primary-foreground shadow-lg shadow-primary/25',
      ]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        :class="iconClass[size]"
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

    <span v-if="showName" class="font-bold tracking-tight" :class="nameClass[size]"> Finwall </span>
  </div>
</template>
