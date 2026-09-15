<script setup lang="ts">
import { useBreadcrumbs } from '@/composables/useBreadcrumbs'
import { ChevronRight } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { items } = useBreadcrumbs()
const { t } = useI18n()
</script>

<template>
  <nav :aria-label="t('common.navigation.BREADCRUMB_LABEL')" class="min-w-0">
    <ol class="flex min-w-0 items-center gap-1.5 text-sm">
      <template v-for="(item, index) in items" :key="`${item.label}-${index}`">
        <ChevronRight
          v-if="index > 0"
          class="size-3.5 shrink-0 text-muted-foreground/50"
          aria-hidden="true"
        />
        <li
          class="truncate"
          :class="
            index === items.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'
          "
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </li>
      </template>
    </ol>
  </nav>
</template>
