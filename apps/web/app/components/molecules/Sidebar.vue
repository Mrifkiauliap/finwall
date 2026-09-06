<!-- app/components/molecules/Sidebar.vue -->
<script setup lang="ts">
import { LogOut } from "lucide-vue-next";
import { useNavigation } from "@/composables/useNavigation";

const route = useRoute();
const authStore = useAuthStore();
const { filteredNavigation } = useNavigation();

const isActive = (path: string) => route.path.startsWith(path);

const isLoggingOut = ref(false);
async function handleLogout() {
  isLoggingOut.value = true;
  try {
    await authStore.logout();
  } finally {
    isLoggingOut.value = false;
  }
}
</script>

<template>
  <aside class="w-64 bg-card border-r min-h-screen p-4 flex flex-col">
    <!-- Brand -->
    <div class="flex items-center gap-2.5 px-3 py-2 mb-6">
      <div
        class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4 text-primary-foreground"
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
      <div class="min-w-0">
        <p class="text-sm font-bold leading-none truncate">Finwall</p>
        <p class="text-xs text-muted-foreground truncate mt-0.5">
          {{ authStore.currentTenant?.name || "Workspace" }}
        </p>
      </div>
    </div>

    <!-- Nav groups -->
    <div class="flex flex-col gap-6 flex-1">
      <div
        v-for="(group, gIdx) in filteredNavigation"
        :key="gIdx"
        class="flex flex-col gap-1"
      >
        <h3
          v-if="group.groupName"
          class="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-1"
        >
          {{ group.groupName }}
        </h3>

        <nav class="flex flex-col gap-0.5">
          <NuxtLink
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="[
              isActive(item.path)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            ]"
          >
            <span>{{ item.name }}</span>

            <span
              v-if="item.badge"
              class="ml-auto text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {{ item.badge }}
            </span>
          </NuxtLink>
        </nav>
      </div>
    </div>

    <!-- User info + Logout -->
    <div class="border-t pt-4 mt-4 flex flex-col gap-1">
      <!-- User info -->
      <div class="flex items-center gap-2.5 px-3 py-2 rounded-lg">
        <div
          class="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0"
        >
          <span class="text-xs font-bold text-primary uppercase">
            {{ (authStore.user?.username ?? authStore.user?.email ?? "?")[0] }}
          </span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium truncate leading-none">
            {{ authStore.user?.username || authStore.user?.email }}
          </p>
          <p class="text-xs text-muted-foreground truncate capitalize mt-0.5">
            {{ authStore.currentTenant?.role || "member" }}
          </p>
        </div>
      </div>

      <!-- Logout button -->
      <button
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
        :disabled="isLoggingOut"
        @click="handleLogout"
      >
        <LogOut
          class="w-4 h-4 shrink-0"
          :class="{ 'animate-spin': isLoggingOut }"
        />
        <span>{{ isLoggingOut ? "Keluar..." : "Keluar" }}</span>
      </button>
    </div>
  </aside>
</template>
