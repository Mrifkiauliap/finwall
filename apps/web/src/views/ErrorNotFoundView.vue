<script setup lang="ts">
import { ArrowLeft, Compass } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t } = useI18n()
</script>

<template>
  <div
    class="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6 text-center"
  >
    <div class="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <Compass class="size-8" />
    </div>

    <div class="space-y-2">
      <p class="text-5xl font-bold tracking-tight text-primary">404</p>
      <h1 class="text-xl font-semibold">{{ t('common.error.404') }}</h1>
      <p class="max-w-md text-sm text-muted-foreground">
        {{ t('common.error.404_DESC') }}
      </p>
    </div>

    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      <ArrowLeft class="size-4" />
      {{ t('common.error.BACK_TO_HOME') }}
    </RouterLink>
  </div>
</template>
