<!-- app/components/navigation/AppBreadcrumb.vue -->
<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next";

const { items } = useBreadcrumbs();
const { t } = useI18n();

// Dipakai untuk memicu ulang animasi masuk setiap kali rute berubah.
const route = useRoute();
const crumbKey = computed(() => route.path);
</script>

<template>
  <nav
    v-if="items.length"
    :aria-label="t('common.navigation.BREADCRUMB_LABEL')"
  >
    <ol :key="crumbKey" class="flex min-w-0 items-center gap-1.5 text-sm">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="crumb-item flex min-w-0 items-center gap-1.5"
        :style="{ '--crumb-delay': `${index * 45}ms` }"
      >
        <ChevronRight
          v-if="index > 0"
          class="size-3.5 shrink-0 text-muted-foreground/50"
          aria-hidden="true"
        />

        <NuxtLink
          v-if="item.to"
          :to="item.to"
          class="truncate rounded-md px-1 py-0.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          {{ item.label }}
        </NuxtLink>

        <span
          v-else
          class="truncate px-1 py-0.5 font-semibold text-foreground"
          aria-current="page"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.crumb-item {
  animation: crumb-in 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--crumb-delay, 0ms);
}

@keyframes crumb-in {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .crumb-item {
    animation: none;
  }
}
</style>
