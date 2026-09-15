<!-- app/components/navigation/WorkspaceTabs.vue -->
<script setup lang="ts">
import { useTenantTabs } from "@/composables/useTenantTabs";

const { tabs, isActive } = useTenantTabs();
</script>

<template>
  <nav
    class="relative -mx-4 flex gap-1 overflow-x-auto border-b px-4 pb-px sm:mx-0 sm:px-0"
  >
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="relative shrink-0 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors duration-200"
      :class="
        isActive(tab.to)
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      "
      :aria-current="isActive(tab.to) ? 'page' : undefined"
    >
      {{ tab.label }}

      <!-- Indikator aktif: garis bawah yang tumbuh dari tengah -->
      <span
        class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        :class="isActive(tab.to) ? 'scale-x-100' : 'scale-x-0'"
        aria-hidden="true"
      />
    </NuxtLink>
  </nav>
</template>
