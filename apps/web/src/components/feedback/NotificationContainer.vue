<script setup lang="ts">
import NotificationItem from '@/components/feedback/NotificationItem.vue'
import { useNotification } from '@/composables/useNotification'

const { notifications, dismiss } = useNotification()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-4 top-4 z-[9999] flex flex-col gap-3 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-full sm:max-w-md"
  >
    <TransitionGroup name="toast-list">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="pointer-events-auto w-full transition-all duration-300"
      >
        <NotificationItem :notification="notification" @dismiss="dismiss(notification.id)" />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-list-enter-active {
  transition: all 0.35s cubic-bezier(0.21, 1.02, 0.73, 1);
}

.toast-list-leave-active {
  transition: all 0.25s cubic-bezier(0.06, 0.71, 0.55, 1);
  position: absolute;
  width: 100%;
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateY(-16px) scale(0.92);
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.toast-list-move {
  transition: transform 0.3s cubic-bezier(0.21, 1.02, 0.73, 1);
}
</style>
