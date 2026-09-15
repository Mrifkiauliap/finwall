<script setup lang="ts">
import AuthShell from '@/components/auth/AuthShell.vue'
import TextField from '@/components/auth/TextField.vue'
import { useApiError } from '@/composables/useApiError'
import { useNotification } from '@/composables/useNotification'
import { useTenant } from '@/composables/useTenant'
import { useAuthStore } from '@/stores/auth'
import { verifyEmailRequestSchema } from '@finwall/shared'
import { toTypedSchema } from '@vee-validate/zod'
import { CheckCircle2, KeyRound, Loader2, MailCheck, RefreshCw, ShieldCheck } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const { landingPath } = useTenant()
const { resolve: resolveError } = useApiError()
const { notify } = useNotification()
const { t } = useI18n()

const errorMessage = ref<string | null>(null)
const isResending = ref(false)
/** Terisi setelah verifikasi sukses — memicu tampilan sukses. */
const verified = ref(false)

const email = computed(() => authStore.user?.email ?? '')

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(verifyEmailRequestSchema),
  initialValues: { token: '' },
})

const [token, tokenProps] = defineField('token')

const onSubmit = handleSubmit(async (values) => {
  errorMessage.value = null

  try {
    await authStore.verifyEmail(values.token)
    verified.value = true
    notify({
      type: 'success',
      title: t('auth.VERIFY_EMAIL_SUCCESS_TITLE'),
      message: t('auth.VERIFY_EMAIL_SUCCESS_MESSAGE'),
    })
  } catch (err) {
    errorMessage.value = resolveError(err)
  }
})

async function onResend() {
  errorMessage.value = null
  isResending.value = true

  try {
    await authStore.resendVerification()
    notify({
      type: 'success',
      title: t('auth.VERIFY_EMAIL_RESEND_SUCCESS_TITLE'),
      message: t('auth.VERIFY_EMAIL_RESEND_SUCCESS_MESSAGE'),
    })
  } catch (err) {
    // Cooldown server (60 detik) juga muncul lewat jalur ini.
    errorMessage.value = resolveError(err)
  } finally {
    isResending.value = false
  }
}

/** Kembali ke halaman utama tenant (dashboard) — aman bila belum ada tenant. */
function goToApp() {
  void router.push(landingPath())
}
</script>

<template>
  <AuthShell
    :title="t('auth.VERIFY_EMAIL_TITLE')"
    :subtitle="verified ? undefined : t('auth.VERIFY_EMAIL_SUBTITLE', { email })"
    :icon="verified ? CheckCircle2 : MailCheck"
  >
    <!-- Sukses -->
    <template v-if="verified">
      <div class="flex flex-col items-center gap-4 py-2 text-center">
        <div class="flex size-16 items-center justify-center rounded-full bg-income/10 text-income">
          <CheckCircle2 class="size-8" />
        </div>
        <div class="space-y-1">
          <p class="font-semibold text-foreground">{{ t('auth.VERIFY_EMAIL_SUCCESS_TITLE') }}</p>
          <p class="text-sm text-muted-foreground">{{ t('auth.VERIFY_EMAIL_SUCCESS_MESSAGE') }}</p>
        </div>
        <button
          type="button"
          class="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          @click="goToApp"
        >
          {{ t('auth.VERIFY_EMAIL_CONTINUE') }}
        </button>
      </div>
    </template>

    <!-- Sudah terverifikasi (mis. user membuka halaman ini dua kali) -->
    <template v-else-if="authStore.emailVerified">
      <div class="flex flex-col items-center gap-4 py-2 text-center">
        <div
          class="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <ShieldCheck class="size-8" />
        </div>
        <p class="text-sm text-muted-foreground">{{ t('auth.VERIFY_EMAIL_ALREADY_VERIFIED') }}</p>
        <button
          type="button"
          class="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          @click="goToApp"
        >
          {{ t('auth.VERIFY_EMAIL_CONTINUE') }}
        </button>
      </div>
    </template>

    <!-- Form kode verifikasi -->
    <template v-else>
      <!-- Alamat tujuan ditampilkan eksplisit: kode tidak dikirim ke sembarang
           email, melainkan ke email akun yang sedang login. -->
      <p class="text-center text-xs text-muted-foreground">
        {{ t('auth.VERIFY_EMAIL_SENT_TO') }}
        <span class="font-medium text-foreground">{{ email }}</span>
      </p>

      <div
        v-if="errorMessage"
        class="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
        role="alert"
      >
        <KeyRound class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{{ errorMessage }}</span>
      </div>

      <form class="mt-4 space-y-4" @submit.prevent="onSubmit">
        <TextField
          id="verify-token"
          v-model="token"
          v-bind="tokenProps"
          :label="t('auth.VERIFY_EMAIL_CODE_LABEL')"
          :placeholder="t('auth.VERIFY_EMAIL_CODE_PLACEHOLDER')"
          :icon="KeyRound"
          autocomplete="one-time-code"
          autocapitalize="characters"
          code
          :error="errors.token"
        />

        <button
          type="submit"
          :disabled="isSubmitting"
          class="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <Loader2 v-if="isSubmitting" class="size-4 animate-spin" />
          <ShieldCheck v-else class="size-4" />
          {{ isSubmitting ? t('auth.VERIFY_EMAIL_SUBMIT_LOADING') : t('auth.VERIFY_EMAIL_SUBMIT') }}
        </button>

        <button
          type="button"
          :disabled="isResending"
          class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border/60 bg-secondary/50 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          @click="onResend"
        >
          <Loader2 v-if="isResending" class="size-4 animate-spin" />
          <RefreshCw v-else class="size-4" />
          {{ isResending ? t('auth.VERIFY_EMAIL_RESENDING') : t('auth.VERIFY_EMAIL_RESEND') }}
        </button>
      </form>
    </template>

    <template #below>
      <p class="text-center text-sm text-muted-foreground">
        <RouterLink to="/settings/profile" class="font-medium text-primary hover:underline">
          {{ t('common.settings.PAGES.PROFILE') }}
        </RouterLink>
        <span class="mx-1.5 text-muted-foreground/40">·</span>
        <RouterLink :to="landingPath()" class="font-medium text-primary hover:underline">
          {{ t('auth.VERIFY_EMAIL_SKIP') }}
        </RouterLink>
      </p>
    </template>
  </AuthShell>
</template>
