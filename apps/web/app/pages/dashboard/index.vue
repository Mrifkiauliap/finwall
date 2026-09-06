<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";

definePageMeta({
  middleware: ["role"],
});

const authStore = useAuthStore();
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-sm text-muted-foreground">
          Selamat datang kembali, {{ authStore.user?.username || "Pengguna" }}!
        </p>
      </div>
    </div>

    <!-- Overview Cards Placeholder -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div
        class="p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-2"
      >
        <p class="text-sm font-medium text-muted-foreground">Workspace Aktif</p>
        <p class="text-2xl font-bold">
          {{ authStore.currentTenant?.name || "-" }}
        </p>
        <p class="text-xs text-muted-foreground capitalize">
          Role: {{ authStore.currentTenant?.role || "-" }}
        </p>
      </div>
    </div>
  </div>
</template>
