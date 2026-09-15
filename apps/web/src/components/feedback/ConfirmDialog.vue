<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import { HelpCircle, TriangleAlert } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { state, handleConfirm, handleCancel } = useConfirm()
const { t } = useI18n()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') handleCancel()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-dialog">
      <div
        v-if="state.isOpen"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-xs sm:items-center"
        role="presentation"
        tabindex="-1"
        @keydown="onKeydown"
        @click.self="handleCancel"
      >
        <div
          class="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-6 text-card-foreground shadow-2xl backdrop-blur-xl transition-all"
          role="alertdialog"
          aria-modal="true"
          :aria-label="state.title || state.message"
        >
          <div
            :class="[
              'pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-20 blur-2xl',
              state.variant === 'danger' ? 'bg-destructive' : 'bg-primary',
            ]"
          />

          <div class="flex items-start gap-4">
            <div
              :class="[
                'flex size-11 shrink-0 items-center justify-center rounded-2xl ring-8 transition-transform duration-200',
                state.variant === 'danger'
                  ? 'bg-destructive/10 text-destructive ring-destructive/10'
                  : 'bg-primary/10 text-primary ring-primary/10',
              ]"
            >
              <TriangleAlert v-if="state.variant === 'danger'" class="size-5" />
              <HelpCircle v-else class="size-5" />
            </div>

            <div class="min-w-0 flex-1 pt-0.5">
              <h2 v-if="state.title" class="text-base font-semibold tracking-tight text-foreground">
                {{ state.title }}
              </h2>
              <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
                {{ state.message }}
              </p>
            </div>
          </div>

          <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl border border-border/60 bg-secondary/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95"
              @click="handleCancel"
            >
              {{ state.cancelText || t('common.BUTTON.CANCEL') }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md transition-all active:scale-95"
              :class="
                state.variant === 'danger'
                  ? 'bg-destructive text-destructive-foreground shadow-destructive/25 hover:bg-destructive/90'
                  : 'bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90'
              "
              @click="handleConfirm"
            >
              {{ state.confirmText || t('common.BUTTON.CONFIRM') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-dialog-enter-active,
.confirm-dialog-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-dialog-enter-from,
.confirm-dialog-leave-to {
  opacity: 0;
}

.confirm-dialog-enter-active > div,
.confirm-dialog-leave-active > div {
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease;
}

.confirm-dialog-enter-from > div,
.confirm-dialog-leave-to > div {
  opacity: 0;
  transform: scale(0.94) translateY(10px);
}
</style>
