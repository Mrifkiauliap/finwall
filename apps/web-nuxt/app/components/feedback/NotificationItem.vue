<script setup lang="ts">
import { CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-vue-next";
import { computed } from "vue";

type NotificationType = "info" | "success" | "warning" | "danger";

interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

const props = defineProps<{
  notification: Notification;
}>();

const emit = defineEmits<{
  dismiss: [];
}>();

const icon = computed(() => {
  return {
    info: Info,
    success: CircleCheck,
    warning: TriangleAlert,
    danger: CircleX,
  }[props.notification.type];
});

const variantStyles = computed(() => {
  return {
    info: {
      card: "border-blue-500/20 bg-background/95 dark:bg-zinc-900/95 shadow-blue-500/5",
      accent: "bg-blue-500",
      badge:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20",
      progress: "bg-blue-500",
    },
    success: {
      card: "border-emerald-500/20 bg-background/95 dark:bg-zinc-900/95 shadow-emerald-500/5",
      accent: "bg-emerald-500",
      badge:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20",
      progress: "bg-emerald-500",
    },
    warning: {
      card: "border-amber-500/20 bg-background/95 dark:bg-zinc-900/95 shadow-amber-500/5",
      accent: "bg-amber-500",
      badge:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-500/20",
      progress: "bg-amber-500",
    },
    danger: {
      card: "border-rose-500/20 bg-background/95 dark:bg-zinc-900/95 shadow-rose-500/5",
      accent: "bg-rose-500",
      badge:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 dark:bg-rose-500/20",
      progress: "bg-rose-500",
    },
  }[props.notification.type];
});
</script>

<template>
  <div
    :class="[
      'group relative flex w-full overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl',
      variantStyles.card,
    ]"
    role="alert"
  >
    <!-- Left Accent Line -->
    <div
      :class="[
        'absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl opacity-90',
        variantStyles.accent,
      ]"
    />

    <div class="flex w-full items-start gap-3.5 pl-1">
      <!-- Icon Badge -->
      <div
        :class="[
          'flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105',
          variantStyles.badge,
        ]"
      >
        <component :is="icon" class="size-5" />
      </div>

      <!-- Content -->
      <div class="min-w-0 flex-1 pt-0.5">
        <p
          v-if="notification.title"
          class="text-sm font-semibold text-foreground tracking-tight"
        >
          {{ notification.title }}
        </p>

        <p
          :class="[
            'text-xs leading-relaxed text-muted-foreground/90',
            notification.title
              ? 'mt-0.5'
              : 'text-sm font-medium text-foreground/90',
          ]"
        >
          {{ notification.message }}
        </p>
      </div>

      <!-- Close Button -->
      <button
        v-if="notification.dismissible !== false"
        type="button"
        class="shrink-0 rounded-lg p-1.5 text-muted-foreground/60 transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-95"
        aria-label="Close notification"
        @click="emit('dismiss')"
      >
        <X class="size-4" />
      </button>
    </div>

    <!-- Progress Bar (Auto dismiss indicator) -->
    <div
      v-if="notification.duration && notification.duration > 0"
      class="absolute bottom-0 left-0 right-0 h-0.5 bg-muted/30 overflow-hidden"
    >
      <div
        :class="['h-full w-full progress-timer', variantStyles.progress]"
        :style="{ animationDuration: `${notification.duration}ms` }"
        @animationend="emit('dismiss')"
      />
    </div>
  </div>
</template>

<style scoped>
.progress-timer {
  animation: shrink-timer linear forwards;
}

.group:hover .progress-timer {
  animation-play-state: paused;
}

@keyframes shrink-timer {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>
