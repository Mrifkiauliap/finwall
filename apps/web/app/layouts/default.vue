<script setup lang="ts">
import Sidebar from "@/components/molecules/Sidebar.vue";
</script>

<template>
  <div class="min-h-screen flex bg-background text-foreground">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <main class="flex-1 p-6 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
