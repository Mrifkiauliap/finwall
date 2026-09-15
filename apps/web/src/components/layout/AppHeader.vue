<script setup lang="ts">
import AccountMenu from '@/components/navigation/AccountMenu.vue'
import AppBreadcrumb from '@/components/navigation/AppBreadcrumb.vue'
import WorkspaceSwitcher from '@/components/navigation/WorkspaceSwitcher.vue'
import { useBreadcrumbs } from '@/composables/useBreadcrumbs'
import { useCommandShell } from '@/composables/useCommandShell'
import { useShortcutMaster } from '@/lib/shortcuts'
import { Bell, Search } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { items: crumbs } = useBreadcrumbs()
const { open } = useCommandShell()
const { format } = useShortcutMaster()
const { t } = useI18n()

/** Petunjuk pintasan (mis. `Ctrl K`), reaktif terhadap master yang dipilih. */
const searchShortcut = computed(() => format('k'))
</script>

<template>
  <header
    class="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
  >
    <div class="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3">
      <!-- Kiri: konteks workspace + breadcrumb -->
      <div class="flex min-w-0 items-center gap-2 sm:gap-3">
        <WorkspaceSwitcher compact />

        <template v-if="crumbs.length">
          <span class="hidden text-muted-foreground/40 sm:inline" aria-hidden="true">/</span>
          <AppBreadcrumb class="hidden min-w-0 sm:block" />
        </template>
      </div>

      <!-- Kanan: aksi -->
      <div class="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <slot name="actions">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:pr-2.5"
            :aria-label="t('common.command.ACTION.SEARCH')"
            :aria-keyshortcuts="searchShortcut"
            @click="open"
          >
            <Search class="size-[1.15rem]" />
            <kbd
              class="hidden rounded border border-border/70 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block"
            >
              {{ searchShortcut }}
            </kbd>
          </button>

          <button
            type="button"
            class="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            :aria-label="t('common.navigation.NOTIFICATIONS')"
          >
            <Bell class="size-[1.15rem]" />
          </button>

          <AccountMenu />
        </slot>
      </div>
    </div>
  </header>
</template>
