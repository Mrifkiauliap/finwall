<script setup lang="ts">
import { Construction } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

/**
 * Halaman "segera hadir" generik. Judul, sub-judul, dan pesan diambil dari
 * `meta` route (i18n key) supaya tidak perlu satu komponen per fitur.
 */
const route = useRoute()
const { t } = useI18n()

const title = computed(() => (route.meta.titleKey ? t(route.meta.titleKey) : t('common.TITLE')))
const subtitle = computed(() => (route.meta.subtitleKey ? t(route.meta.subtitleKey) : ''))
const comingSoon = computed(() => (route.meta.comingSoonKey ? t(route.meta.comingSoonKey) : ''))
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm text-muted-foreground">{{ subtitle }}</p>
    </div>

    <div
      class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 p-12 text-center"
    >
      <div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Construction class="size-6" />
      </div>
      <p class="max-w-sm text-sm text-muted-foreground">{{ comingSoon }}</p>
    </div>
  </div>
</template>
