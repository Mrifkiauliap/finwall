<template>
  <div class="animate-pulse w-full">
    <table class="w-full text-sm text-left text-gray-700">
      <thead
        class="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200"
      >
        <tr>
          <th v-for="n in columns" :key="n" class="px-6 py-4">
            <div class="h-4 bg-gray-300 rounded w-3/4"></div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="i in rows"
          :key="i"
          class="bg-white border-b border-gray-200 hover:bg-gray-50"
        >
          <td v-for="j in columns" :key="j" class="px-6 py-4">
            <div class="h-4 bg-gray-200 rounded w-full"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
defineProps<{ columns: number; rows: number }>();
</script>
