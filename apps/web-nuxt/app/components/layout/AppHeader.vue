<!-- app/components/layout/AppHeader.vue -->
<script setup lang="ts">
import AccountMenu from "@/components/navigation/AccountMenu.vue";
import AppBreadcrumb from "@/components/navigation/AppBreadcrumb.vue";
import WorkspaceSwitcher from "@/components/navigation/WorkspaceSwitcher.vue";
import { useBreadcrumbs } from "@/composables/useBreadcrumbs";
import { Bell, Search } from "lucide-vue-next";

const { items: crumbs } = useBreadcrumbs();
const { t } = useI18n();
</script>

<template>
  <header
    class="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
  >
    <div
      class="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3"
    >
      <!-- Kiri: konteks workspace + breadcrumb (mobile: breadcrumb disembunyikan
           karena ruang sempit dan item aktif sudah ditandai di BottomNav). -->
      <div class="flex min-w-0 items-center gap-2 sm:gap-3">
        <WorkspaceSwitcher compact />

        <template v-if="crumbs.length">
          <span
            class="hidden text-muted-foreground/40 sm:inline"
            aria-hidden="true"
            >/</span
          >
          <AppBreadcrumb class="hidden min-w-0 sm:block" />
        </template>
      </div>

      <!-- Kanan: aksi -->
      <div class="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <slot name="actions">
          <button
            type="button"
            class="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            :aria-label="t('common.navigation.SEARCH')"
          >
            <Search class="size-[1.15rem]" />
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
