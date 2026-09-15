<!-- app/components/feedback/ConfirmDialog.vue -->
<script setup lang="ts">
import { useConfirm } from "@/composables/useConfirm";
import { HelpCircle, TriangleAlert } from "lucide-vue-next";

const { state, handleConfirm, handleCancel } = useConfirm();

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") handleCancel();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-dialog">
      <div
        v-if="state.isOpen"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-xs sm:items-center"
        role="presentation"
        @keydown="onKeydown"
        @click.self="handleCancel"
      >
        <div
          class="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-6 text-card-foreground shadow-2xl backdrop-blur-xl transition-all sm:rounded-2xl"
          role="alertdialog"
          aria-modal="true"
          :aria-label="state.title || state.message"
        >
          <!-- Subtle glow background blur spot -->
          <div
            :class="[
              'absolute -right-10 -top-10 size-32 rounded-full blur-2xl pointer-events-none opacity-20',
              state.variant === 'danger' ? 'bg-destructive' : 'bg-primary',
            ]"
          />

          <div class="flex items-start gap-4">
            <!-- Icon Badge with Ring Glow -->
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

            <!-- Content -->
            <div class="min-w-0 flex-1 pt-0.5">
              <h2
                v-if="state.title"
                class="text-base font-semibold tracking-tight text-foreground"
              >
                {{ state.title }}
              </h2>
              <p class="mt-1 text-sm text-muted-foreground leading-relaxed">
                {{ state.message }}
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div
            class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3"
          >
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl border border-border/60 bg-secondary/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95"
              @click="handleCancel"
            >
              {{ state.cancelText || "Batal" }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-md active:scale-95"
              :class="
                state.variant === 'danger'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/25'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25'
              "
              @click="handleConfirm"
            >
              {{ state.confirmText || "Konfirmasi" }}
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
