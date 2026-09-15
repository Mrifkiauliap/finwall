<!-- Form catat transaksi. Tampil sebagai dialog di desktop dan sheet bawah di
     mobile (kelas posisi dipilih lewat breakpoint). -->
<script setup lang="ts">
import { useNotification } from '@/composables/useNotification'
import { useAccounts } from '@/features/accounts/composables/useAccounts'
import { useTransactionForm } from '@/features/transaction/composables/useTransactionForm'
import { formatCurrency } from '@/lib/format'
import { Check, Loader2, X } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t, locale } = useI18n()
const { accounts, hasAccounts } = useAccounts()
const { notify } = useNotification()

const {
  isSubmitting,
  isTransfer,
  destinationAccounts,
  categoryOptions,
  type,
  amount,
  amountProps,
  currency,
  currencyProps,
  categoryKey,
  categoryProps,
  accountId,
  accountProps,
  toAccountId,
  toAccountProps,
  date,
  dateProps,
  note,
  noteProps,
  errors,
  submit,
} = useTransactionForm({
  onSuccess: () => {
    notify({ type: 'success', message: t('transactions.CREATED') })
    emit('close')
  },
})

const typeOptions = computed(() => [
  { value: 'expense' as const, label: t('transactions.FILTER.EXPENSE') },
  { value: 'income' as const, label: t('transactions.FILTER.INCOME') },
  { value: 'transfer' as const, label: t('transactions.FILTER.TRANSFER') },
])
/** Pratinjau nominal agar pengguna yakin sebelum menyimpan. */
const amountPreview = computed(() => {
  const value = Number(amount.value ?? 0)
  return value > 0 ? formatCurrency(value, currency.value, locale.value) : null
})
const canSubmit = computed(() => hasAccounts.value && !isSubmitting.value)
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="props.open"
        class="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-xs sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="t('transactions.FORM_TITLE')"
        @click.self="emit('close')"
      >
        <div
          class="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border bg-card text-card-foreground shadow-2xl sm:max-w-lg sm:rounded-2xl"
        >
          <!-- Header -->
          <div class="flex shrink-0 items-center justify-between border-b px-5 py-4">
            <h2 class="text-base font-semibold">{{ t('transactions.FORM_TITLE') }}</h2>
            <button
              type="button"
              class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              :aria-label="t('common.navigation.CLOSE')"
              @click="emit('close')"
            >
              <X class="size-4" />
            </button>
          </div>

          <!-- Tidak ada akun -> arahkan buat akun dulu -->
          <div v-if="!hasAccounts" class="space-y-3 p-6 text-center">
            <p class="text-sm font-medium">{{ t('transactions.NO_ACCOUNT_TITLE') }}</p>
            <p class="text-sm text-muted-foreground">
              {{ t('transactions.NO_ACCOUNT_DESCRIPTION') }}
            </p>
          </div>

          <form v-else class="flex-1 space-y-4 overflow-y-auto p-5" @submit.prevent="submit">
            <!-- Jenis -->
            <div class="flex rounded-lg bg-muted p-0.5 text-sm font-medium" role="tablist">
              <button
                v-for="option in typeOptions"
                :key="option.value"
                type="button"
                role="tab"
                :aria-selected="type === option.value"
                class="flex-1 rounded-md px-3 py-2 transition-colors"
                :class="
                  type === option.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                "
                @click="type = option.value"
              >
                {{ option.label }}
              </button>
            </div>

            <!-- Nominal -->
            <div class="space-y-2">
              <label for="tx-amount" class="block text-sm font-medium">
                {{ t('transactions.AMOUNT_LABEL') }}
              </label>
              <input
                id="tx-amount"
                v-model="amount"
                v-bind="amountProps"
                type="number"
                min="0"
                step="any"
                inputmode="decimal"
                class="h-11 w-full rounded-lg border border-input bg-background px-3 text-lg font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :aria-invalid="errors.amount ? true : undefined"
              />
              <p v-if="errors.amount" class="text-xs font-medium text-destructive">
                {{ t(`validation.${errors.amount}`) }}
              </p>
              <p v-else-if="amountPreview" class="text-xs text-muted-foreground">
                {{ amountPreview }}
              </p>
            </div>

            <!-- Mata uang + tanggal -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <label for="tx-currency" class="block text-sm font-medium">
                  {{ t('transactions.CURRENCY_LABEL') }}
                </label>
                <select
                  id="tx-currency"
                  v-model="currency"
                  v-bind="currencyProps"
                  class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div class="space-y-2">
                <label for="tx-date" class="block text-sm font-medium">
                  {{ t('transactions.DATE_LABEL') }}
                </label>
                <input
                  id="tx-date"
                  v-model="date"
                  v-bind="dateProps"
                  type="date"
                  class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  :aria-invalid="errors.date ? true : undefined"
                />
                <p v-if="errors.date" class="text-xs font-medium text-destructive">
                  {{ t(`validation.${errors.date}`) }}
                </p>
              </div>
            </div>

            <!-- Kategori -->
            <div class="space-y-2">
              <label for="tx-category" class="block text-sm font-medium">
                {{ t('transactions.CATEGORY_LABEL') }}
              </label>
              <select
                id="tx-category"
                v-model="categoryKey"
                v-bind="categoryProps"
                class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option v-for="key in categoryOptions" :key="key" :value="key">
                  {{ t(`transactions.CATEGORY.${key}`) }}
                </option>
              </select>
            </div>

            <!-- Akun asal -->
            <div class="space-y-2">
              <label for="tx-account" class="block text-sm font-medium">
                {{
                  isTransfer
                    ? t('transactions.FROM_ACCOUNT_LABEL')
                    : t('transactions.ACCOUNT_LABEL')
                }}
              </label>
              <select
                id="tx-account"
                v-model="accountId"
                v-bind="accountProps"
                class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :aria-invalid="errors.accountId ? true : undefined"
              >
                <option value="" disabled>{{ t('transactions.ACCOUNT_PLACEHOLDER') }}</option>
                <option
                  v-for="account in accounts"
                  :key="account.publicId"
                  :value="account.publicId"
                >
                  {{ account.name }}
                </option>
              </select>
              <p v-if="errors.accountId" class="text-xs font-medium text-destructive">
                {{ t(`validation.${errors.accountId}`) }}
              </p>
            </div>

            <!-- Akun tujuan (khusus transfer) -->
            <div v-if="isTransfer" class="space-y-2">
              <label for="tx-to-account" class="block text-sm font-medium">
                {{ t('transactions.TO_ACCOUNT_LABEL') }}
              </label>
              <select
                id="tx-to-account"
                v-model="toAccountId"
                v-bind="toAccountProps"
                class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :aria-invalid="errors.toAccountId ? true : undefined"
              >
                <option value="" disabled>{{ t('transactions.ACCOUNT_PLACEHOLDER') }}</option>
                <option
                  v-for="account in destinationAccounts"
                  :key="account.publicId"
                  :value="account.publicId"
                >
                  {{ account.name }}
                </option>
              </select>
              <p v-if="errors.toAccountId" class="text-xs font-medium text-destructive">
                {{ t(`validation.${errors.toAccountId}`) }}
              </p>
            </div>

            <!-- Catatan -->
            <div class="space-y-2">
              <label for="tx-note" class="block text-sm font-medium">
                {{ t('transactions.NOTE_LABEL') }}
              </label>
              <textarea
                id="tx-note"
                v-model="note"
                v-bind="noteProps"
                rows="2"
                :placeholder="t('transactions.NOTE_PLACEHOLDER')"
                class="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :aria-invalid="errors.note ? true : undefined"
              />
              <p v-if="errors.note" class="text-xs font-medium text-destructive">
                {{ t(`validation.${errors.note}`) }}
              </p>
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
                :disabled="!canSubmit"
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
/* Sheet naik dari bawah (mobile) / dialog fade-scale (desktop). */
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
