<!-- app/components/settings/SettingsNav.vue -->
<!-- Navigasi halaman Pengaturan.
     `variant="sidebar"` : kolom kiri (desktop) + tombol Back/ESC.
     `variant="tabs"`    : strip horizontal (mobile). -->
<script setup lang="ts">
import {
  useSettingsNav,
  type SettingsIconName,
} from "@/composables/useSettingsNav";
import {
  ChevronLeft,
  ShieldCheck,
  SlidersHorizontal,
  User,
  type LucideIcon,
} from "lucide-vue-next";

const props = withDefaults(defineProps<{ variant?: "sidebar" | "tabs" }>(), {
  variant: "sidebar",
});

const { groups, isActive } = useSettingsNav();
const { t } = useI18n();

// Kunci dibatasi `SettingsIconName` supaya menambah item di config tanpa
// ikon yang cocok langsung ketahuan saat type-check.
const icons: Record<SettingsIconName, LucideIcon> = {
  User,
  SlidersHorizontal,
  ShieldCheck,
};

const emit = defineEmits<{ back: [] }>();
</script>

<template>
  <!-- Sidebar (desktop) -->
  <aside
    v-if="props.variant === 'sidebar'"
    class="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-sidebar/40 lg:flex"
  >
    <!-- Back + hint ESC -->
    <div class="flex items-center justify-between gap-2 px-3 py-3">
      <button
        type="button"
        class="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        @click="emit('back')"
      >
        <ChevronLeft
          class="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
        />
        {{ t("common.settings.BACK") }}
      </button>

      <kbd
        class="rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
      >
        ESC
      </kbd>
    </div>

    <!-- Grup item -->
    <nav class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4">
      <div
        v-for="(group, gIdx) in groups"
        :key="group.groupName ?? gIdx"
        class="flex flex-col gap-0.5"
      >
        <h3
          v-if="group.groupName"
          class="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70"
        >
          {{ group.groupName }}
        </h3>

        <NuxtLink
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-200"
          :class="
            isActive(item.path)
              ? 'bg-sidebar-accent text-foreground'
              : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
          "
          :aria-current="isActive(item.path) ? 'page' : undefined"
        >
          <!-- Indikator aktif di kiri -->
          <span
            class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            :class="
              isActive(item.path)
                ? 'scale-y-100 opacity-100'
                : 'scale-y-0 opacity-0'
            "
            aria-hidden="true"
          />
          <component
            :is="icons[item.icon]"
            class="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
          />
          <span class="truncate">{{ item.name }}</span>
        </NuxtLink>
      </div>
    </nav>
  </aside>

  <!-- Tabs (mobile) -->
  <nav v-else class="flex gap-1 overflow-x-auto border-b px-3 pb-2 lg:hidden">
    <NuxtLink
      v-for="item in groups.flatMap((g) => g.items)"
      :key="item.path"
      :to="item.path"
      class="relative shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200"
      :class="
        isActive(item.path)
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      "
      :aria-current="isActive(item.path) ? 'page' : undefined"
    >
      {{ item.name }}
    </NuxtLink>
  </nav>
</template>
