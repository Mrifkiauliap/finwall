<!-- Form buat akun. Dialog di desktop, sheet bawah di mobile. -->
<script setup lang="ts">
import { useNotification } from '@/composables/useNotification'
import { useAccountForm } from '@/features/accounts/composables/useAccountForm'
import { ACCOUNT_TYPE_DEFS } from '@/features/accounts/types'
import { formatCurrency } from '@/lib/format'
import type { Account } from '@finwall/shared'
import { Check, Loader2, X } from 'lucide-vue-next'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    open: boolean
    /** Bila diisi, form berjalan dalam mode edit. */
    account?: Account | null
  }>(),
  { account: null },
)

const emit = defineEmits<{ close: [] }>()

const { t, locale } = useI18n()
const { notify } = useNotification()

const {
  isSubmitting,
  name,
  nameProps,
  type,
  typeProps,
  currency,
  currencyProps,
  initialBalance,
  initialBalanceProps,
  errors,
  submit,
  loadAccount,
} = useAccountForm({
  onSuccess: () => {
    notify({
      type: 'success',
      // Satu pesan untuk buat & ubah; konteks dibedakan oleh judul dialog.
      message: t('accounts.SAVED'),
    })
    emit('close')
  },
})

const isEdit = computed(() => !!props.account)

/** Pilihan jenis akun, label dari i18n (urutan dari definisi domain). */
const typeOptions = computed(() =>
  ACCOUNT_TYPE_DEFS.map((def) => ({
    value: def.type,
    label: t(def.labelKey),
    nature: def.nature,
  })),
)

/** Saldo awal benar-benar ditampilkan sebagai aset (positif) atau utang. */
const balancePreview = computed(() => {
  const value = Number(initialBalance.value ?? 0)
  if (value === 0) return null
  return formatCurrency(value, currency.value || 'IDR', locale.value)
})

// Saat dialog dibuka untuk mengubah akun, muat nilainya ke form.
watch(
  () => [props.open, props.account] as const,
  ([isOpen, account]) => {
    if (!isOpen) return
    if (account) loadAccount(account)
  },
  { immediate: true },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="props.open"
        class="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-xs sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="isEdit ? t('accounts.EDIT_TITLE') : t('accounts.FORM_TITLE')"
        @click.self="emit('close')"
      >
        <div
          class="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border bg-card text-card-foreground shadow-2xl sm:max-w-lg sm:rounded-2xl"
        >
          <div class="flex shrink-0 items-center justify-between border-b px-5 py-4">
            <h2 class="text-base font-semibold">
              {{ isEdit ? t('accounts.EDIT_TITLE') : t('accounts.FORM_TITLE') }}
            </h2>
            <button
              type="button"
              class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              :aria-label="t('common.navigation.CLOSE')"
              @click="emit('close')"
            >
              <X class="size-4" />
            </button>
          </div>

          <form class="flex-1 space-y-4 overflow-y-auto p-5" @submit.prevent="submit">
            <!-- Nama -->
            <div class="space-y-2">
              <label for="acc-name" class="block text-sm font-medium">
                {{ t('accounts.NAME_LABEL') }}
              </label>
              <input
                id="acc-name"
                v-model="name"
                v-bind="nameProps"
                :placeholder="t('accounts.NAME_PLACEHOLDER')"
                class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :aria-invalid="errors.name ? true : undefined"
              />
              <p v-if="errors.name" class="text-xs font-medium text-destructive">
                {{ t(`validation.${errors.name}`) }}
              </p>
            </div>

            <!-- Jenis akun -->
            <div class="space-y-2">
              <label for="acc-type" class="block text-sm font-medium">
                {{ t('accounts.TYPE_LABEL') }}
              </label>
              <select
                id="acc-type"
                v-model="type"
                v-bind="typeProps"
                class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option v-for="option in typeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <p class="text-xs text-muted-foreground">{{ t('accounts.TYPE_HINT') }}</p>
            </div>

            <!-- Saldo awal + mata uang -->
            <div class="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <div class="space-y-2">
                <label for="acc-balance" class="block text-sm font-medium">
                  {{ t('accounts.BALANCE_LABEL') }}
                </label>
                <input
                  id="acc-balance"
                  v-model="initialBalance"
                  v-bind="initialBalanceProps"
                  type="number"
                  step="any"
                  inputmode="decimal"
                  class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  :aria-invalid="errors.initialBalance ? true : undefined"
                />
                <p v-if="errors.initialBalance" class="text-xs font-medium text-destructive">
                  {{ t(`validation.${errors.initialBalance}`) }}
                </p>
                <p v-else-if="balancePreview" class="text-xs text-muted-foreground" data-numeric>
                  {{ balancePreview }}
                </p>
              </div>

              <div class="space-y-2">
                <label for="acc-currency" class="block text-sm font-medium">
                  {{ t('accounts.CURRENCY_LABEL') }}
                </label>
                <select
                  id="acc-currency"
                  v-model="currency"
                  v-bind="currencyProps"
                  class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                <p v-if="errors.currency" class="text-xs font-medium text-destructive">
                  {{ t(`validation.${errors.currency}`) }}
                </p>
              </div>
            </div>

            <!-- Aksi -->
            <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                class="inline-flex h-10 items-center justify-center rounded-lg border border-input px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                @click="emit('close')"
              >
                {{ t('common.BUTTON.CANCEL') }}
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                <Loader2 v-if="isSubmitting" class="size-4 animate-spin" />
                <Check v-else class="size-4" />
                {{ t('common.BUTTON.SAVE') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 200ms ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-active > div,
.sheet-leave-active > div {
  transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.sheet-enter-from > div,
.sheet-leave-to > div {
  transform: translateY(24px);
}

@media (min-width: 640px) {
  .sheet-enter-from > div,
  .sheet-leave-to > div {
    transform: scale(0.96);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active,
  .sheet-enter-active > div,
  .sheet-leave-active > div {
    transition: none;
  }
}
</style>
