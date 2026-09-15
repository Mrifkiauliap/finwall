<!-- app/components/layout/SidebarRail.vue -->
<!-- Rail permanen (hanya desktop): ikon + label singkat, bisa collapse. -->
<script setup lang="ts">
import BrandMark from "@/components/common/BrandMark.vue";
import { useSidebar } from "@/composables/useSidebar";
import {
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-vue-next";

const { filteredNavigation, isActive } = useNavigation();
const { isPanelOpen, togglePanel } = useSidebar();
const { t } = useI18n();

/** Peta nama ikon -> komponen Lucide. */
const icons: Record<string, LucideIcon> = {
  LayoutDashboard,
  Wallet,
  Receipt,
  BarChart3,
  Users,
  Building2,
  CreditCard,
};

const groups = computed(() =>
  filteredNavigation.value.map((group) => ({
    ...group,
    items: group.items,
  })),
);
</script>

<template>
  <nav
    class="hidden w-[4.5rem] shrink-0 flex-col items-center border-r bg-sidebar lg:flex"
    :aria-label="t('common.navigation.MENU_MAIN')"
  >
    <!-- Brand -->
    <div class="flex w-full items-center justify-center py-4">
      <BrandMark size="sm" />
    </div>

    <!-- Item navigasi, dikelompokkan -->
    <div class="flex w-full flex-1 flex-col gap-1 overflow-y-auto px-2 pb-2">
      <template v-for="(group, gIdx) in groups" :key="group.groupName ?? gIdx">
        <div
          v-if="gIdx > 0"
          class="mx-auto my-1.5 h-px w-6 bg-sidebar-border/70"
          aria-hidden="true"
        />

        <NuxtLink
          v-for="item in group.items"
          :key="item.basePath"
          :to="item.path"
          class="group relative flex w-full flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-medium transition-colors"
          :class="
            isActive(item.basePath)
              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          "
          :title="item.name"
          :aria-current="isActive(item.basePath) ? 'page' : undefined"
        >
          <!-- Indikator aktif: bar kecil di kiri, muncul dengan scale -->
          <span
            class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary-foreground transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            :class="
              isActive(item.basePath)
                ? 'scale-y-100 opacity-100'
                : 'scale-y-0 opacity-0'
            "
            aria-hidden="true"
          />

          <component
            :is="icons[item.icon ?? '']"
            v-if="icons[item.icon ?? '']"
            class="size-[1.15rem] shrink-0 transition-transform duration-200 group-hover:scale-110"
          />
          <span class="w-full truncate px-0.5 text-center leading-none">
            {{ item.name }}
          </span>
        </NuxtLink>
      </template>
    </div>

    <!-- Collapse panel akun -->
    <div class="w-full border-t p-2">
      <button
        type="button"
        class="flex w-full items-center justify-center rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        :title="t('workspace.TOGGLE_PANEL')"
        :aria-expanded="isPanelOpen"
        :aria-label="t('workspace.TOGGLE_PANEL')"
        @click="togglePanel"
      >
        <!-- Ikon bertukar dengan fade + rotate halus -->
        <Transition name="icon-swap" mode="out-in">
          <PanelLeftOpen
            v-if="!isPanelOpen"
            key="open"
            class="size-[1.15rem]"
          />
          <PanelLeftClose v-else key="close" class="size-[1.15rem]" />
        </Transition>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.icon-swap-enter-active,
.icon-swap-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.icon-swap-enter-from {
  opacity: 0;
  transform: rotate(-45deg) scale(0.8);
}

.icon-swap-leave-to {
  opacity: 0;
  transform: rotate(45deg) scale(0.8);
}
</style>
