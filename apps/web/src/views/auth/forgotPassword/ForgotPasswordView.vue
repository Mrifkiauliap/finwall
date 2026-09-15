<script setup lang="ts">
import AuthShell from '@/components/auth/AuthShell.vue'
import TextField from '@/components/auth/TextField.vue'
import { useApiError } from '@/composables/useApiError'
import { useAuthStore } from '@/stores/auth'
import { forgotPasswordRequestSchema } from '@finwall/shared'
import { toTypedSchema } from '@vee-validate/zod'
import { KeyRound, Loader2, MailCheck, SendHorizonal, User } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()
const { resolve: resolveError } = useApiError()
const { t } = useI18n()

const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const submitted = ref(false)

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(forgotPasswordRequestSchema),
  initialValues: { identifier: '' },
})

const [identifier, identifierProps] = defineField('identifier')

const onSubmit = handleSubmit(async (values) => {
  errorMessage.value = null

  try {
    await authStore.forgotPassword({ identifier: values.identifier })
    submitted.value = true
    successMessage.value = t('auth.FORGOT_PASSWORD_SUCCESS_MESSAGE')
  } catch (err) {
    errorMessage.value = resolveError(err)
  }
})
</script>

<template>
  <AuthShell
    :title="t('auth.FORGOT_PASSWORD_TITLE')"
    :subtitle="submitted ? undefined : t('auth.FORGOT_PASSWORD_SUBTITLE')"
    :icon="submitted ? MailCheck : KeyRound"
  >
    <!-- Sukses -->
    <template v-if="submitted">
      <div class="flex flex-col items-center gap-4 py-2 text-center">
        <div
          class="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <MailCheck class="size-8" />
        </div>
        <div class="space-y-1">
          <p class="font-semibold text-foreground">{{ t('auth.FORGOT_PASSWORD_SUCCESS_TITLE') }}</p>
          <p class="text-sm text-muted-foreground">{{ successMessage }}</p>
        </div>
        <RouterLink
          to="/forgot-password/reset"
          class="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {{ t('auth.FORGOT_PASSWORD_ENTER_CODE') }}
        </RouterLink>
        <button
          type="button"
          class="text-sm text-muted-foreground hover:text-foreground hover:underline"
          @click="submitted = false"
        >
          {{ t('auth.FORGOT_PASSWORD_RESEND') }}
        </button>
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
          id="identifier"
          v-model="identifier"
          v-bind="identifierProps"
          :label="t('auth.IDENTIFIER_LABEL')"
          :placeholder="t('auth.IDENTIFIER_PLACEHOLDER')"
          :icon="User"
          autocomplete="username"
          :error="errors.identifier"
        />

        <button
          type="submit"
          :disabled="isSubmitting"
          class="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <Loader2 v-if="isSubmitting" class="size-4 animate-spin" />
          <SendHorizonal v-else class="size-4" />
          <span>
            {{
              isSubmitting
                ? t('auth.FORGOT_PASSWORD_SUBMIT_LOADING')
                : t('auth.FORGOT_PASSWORD_SUBMIT')
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
