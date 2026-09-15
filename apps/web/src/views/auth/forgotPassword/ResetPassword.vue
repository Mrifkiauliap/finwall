<script setup lang="ts">
import AuthShell from '@/components/auth/AuthShell.vue'
import TextField from '@/components/auth/TextField.vue'
import { useApiError } from '@/composables/useApiError'
import { useNotification } from '@/composables/useNotification'
import { useAuthStore } from '@/stores/auth'
import { resetPasswordRequestSchema } from '@finwall/shared'
import { toTypedSchema } from '@vee-validate/zod'
import { CheckCircle2, KeyRound, Loader2, Lock, ShieldCheck } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()
const { resolve: resolveError } = useApiError()
const { notify } = useNotification()
const { t } = useI18n()

const errorMessage = ref<string | null>(null)
const success = ref(false)

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(resetPasswordRequestSchema),
  initialValues: { token: '', password: '', confirmPassword: '' },
})

const [token, tokenProps] = defineField('token')
const [password, passwordProps] = defineField('password')
const [confirmPassword, confirmPasswordProps] = defineField('confirmPassword')

const onSubmit = handleSubmit(async (values) => {
  errorMessage.value = null

  if (values.password !== values.confirmPassword) {
    errorMessage.value = t('auth.RESET_PASSWORDS_NOT_MATCH')
    return
  }

  try {
    await authStore.resetPassword({
      token: values.token,
      password: values.password,
      confirmPassword: values.confirmPassword,
    })
    success.value = true
    notify({
      type: 'success',
      title: t('auth.RESET_PASSWORD_SUCCESS_TITLE'),
      message: t('auth.RESET_PASSWORD_SUCCESS_MESSAGE'),
    })
  } catch (err) {
    errorMessage.value = resolveError(err)
  }
})
</script>

<template>
  <AuthShell
    :title="t('auth.RESET_PASSWORD_TITLE')"
    :subtitle="success ? undefined : t('auth.RESET_PASSWORD_SUBTITLE')"
    :icon="success ? CheckCircle2 : ShieldCheck"
  >
    <!-- Sukses -->
    <template v-if="success">
      <div class="flex flex-col items-center gap-4 py-2 text-center">
        <!-- Memakai token semantik `income` (hijau "uang masuk"), bukan
             `green-500` mentah, agar warnanya ikut menyesuaikan mode gelap. -->
        <div class="flex size-16 items-center justify-center rounded-full bg-income/10 text-income">
          <CheckCircle2 class="size-8" />
        </div>
        <div class="space-y-1">
          <p class="font-semibold text-foreground">{{ t('auth.RESET_PASSWORD_SUCCESS_TITLE') }}</p>
          <p class="text-sm text-muted-foreground">
            {{ t('auth.RESET_PASSWORD_SUCCESS_MESSAGE') }}
          </p>
        </div>
        <RouterLink
          to="/signin"
          class="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {{ t('auth.SUBMIT') }}
        </RouterLink>
      </div>
    </template>

    <!-- Form -->
    <template v-else>
      <div
        v-if="errorMessage"
        class="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
        role="alert"
      >
        <KeyRound class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{{ errorMessage }}</span>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <TextField
          id="reset-token"
          v-model="token"
          v-bind="tokenProps"
          :label="t('auth.RESET_TOKEN_LABEL')"
          :placeholder="t('auth.RESET_TOKEN_PLACEHOLDER')"
          :icon="KeyRound"
          autocomplete="one-time-code"
          autocapitalize="characters"
          code
          :error="errors.token"
        />

        <TextField
          id="reset-password"
          v-model="password"
          v-bind="passwordProps"
          :label="t('auth.RESET_NEW_PASSWORD_LABEL')"
          placeholder="••••••••"
          :icon="Lock"
          autocomplete="new-password"
          password-toggle
          :error="errors.password"
        />

        <TextField
          id="reset-confirm-password"
          v-model="confirmPassword"
          v-bind="confirmPasswordProps"
          :label="t('auth.RESET_CONFIRM_PASSWORD_LABEL')"
          placeholder="••••••••"
          :icon="Lock"
          autocomplete="new-password"
          password-toggle
          :error="errors.confirmPassword"
        />

        <button
          type="submit"
          :disabled="isSubmitting"
          class="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <Loader2 v-if="isSubmitting" class="size-4 animate-spin" />
          <ShieldCheck v-else class="size-4" />
          <span>
            {{
              isSubmitting
                ? t('auth.RESET_PASSWORD_SUBMIT_LOADING')
                : t('auth.RESET_PASSWORD_SUBMIT')
            }}
          </span>
        </button>
      </form>
    </template>

    <template #below>
      <p class="text-center text-sm text-muted-foreground">
        <RouterLink to="/signin" class="font-medium text-primary hover:underline">
          ← {{ t('auth.FORGOT_PASSWORD_BACK') }}
        </RouterLink>
      </p>
    </template>
  </AuthShell>
</template>
