<script setup lang="ts">
import AuthShell from "@/components/auth/AuthShell.vue";
import PasswordStrength from "@/components/auth/PasswordStrength.vue";
import TextField from "@/components/auth/TextField.vue";
import { useApiError } from "@/composables/useApiError";
import { useNotification } from "@/composables/useNotification";
import { useAuthStore } from "@/stores/auth";
import { signupRequestSchema } from "@finwall/shared";
import { toTypedSchema } from "@vee-validate/zod";
import {
  CircleAlert,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Phone,
  User,
} from "lucide-vue-next";
import { useForm } from "vee-validate";

definePageMeta({
  layout: false,
  middleware: "guest",
});

// Zona waktu browser dipakai sebagai default.
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

const authStore = useAuthStore();
const { landingPath } = useTenant();
const { notify, notifyAfterReload } = useNotification();
const { resolve: resolveError } = useApiError();
const { t } = useI18n();

const errorMessage = ref<string | null>(null);

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(signupRequestSchema),
  initialValues: {
    username: "",
    email: "",
    phone: "",
    password: "",
    timezone: tz,
  },
});

const [username, usernameProps] = defineField("username");
const [email, emailProps] = defineField("email");
const [phone, phoneProps] = defineField("phone");
const [password, passwordProps] = defineField("password");

const isBusy = computed(() => isSubmitting.value || authStore.isLoading);

const onSubmit = handleSubmit(async (values) => {
  errorMessage.value = null;

  try {
    await authStore.signUp({
      username: values.username,
      email: values.email,
      phone: values.phone || null,
      password: values.password,
      timezone: tz,
    });
    notifyAfterReload({
      type: "success",
      title: t("auth.SIGNUP_SUCCESS_TITLE"),
      message: t("auth.SIGNUP_SUCCESS_MESSAGE", {
        username: values.username,
      }),
    });

    // Navigasi SPA (bukan full reload) supaya state sesi tetap hidup.
    // User baru biasanya belum punya tenant -> `landingPath` mengarahkan ke
    // onboarding bila memang belum ada workspace.
    await navigateTo(landingPath());
  } catch (err) {
    const message = resolveError(err);
    notify({ type: "danger", message });
    errorMessage.value = message;
  }
});
</script>

<template>
  <AuthShell
    :title="t('auth.SIGNUP_TITLE')"
    :subtitle="t('auth.SIGNUP_SUBTITLE')"
    :icon="LogIn"
  >
    <div
      v-if="errorMessage"
      class="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
      role="alert"
    >
      <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{{ errorMessage }}</span>
    </div>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <TextField
        id="username"
        v-model="username"
        v-bind="usernameProps"
        :label="t('auth.USERNAME_LABEL')"
        :placeholder="t('auth.USERNAME_PLACEHOLDER')"
        :icon="User"
        autocomplete="username"
        :error="errors.username"
      />

      <TextField
        id="email"
        v-model="email"
        v-bind="emailProps"
        type="email"
        :label="t('auth.EMAIL_LABEL')"
        :placeholder="t('auth.EMAIL_PLACEHOLDER')"
        :icon="Mail"
        autocomplete="email"
        :error="errors.email"
      />

      <TextField
        id="phone"
        v-model="phone"
        v-bind="phoneProps"
        type="tel"
        :label="t('auth.PHONE_LABEL')"
        :placeholder="t('auth.PHONE_PLACEHOLDER')"
        :icon="Phone"
        autocomplete="tel"
        :error="errors.phone"
      />

      <!-- Password + indikator kekuatan (mengikuti aturan signupRequestSchema) -->
      <div class="space-y-3">
        <TextField
          id="password"
          v-model="password"
          v-bind="passwordProps"
          :label="t('auth.PASSWORD_LABEL')"
          placeholder="••••••••"
          :icon="Lock"
          autocomplete="new-password"
          password-toggle
          :error="errors.password"
        />
        <PasswordStrength v-model="password" />
      </div>

      <button
        type="submit"
        :disabled="isBusy"
        class="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <Loader2 v-if="isBusy" class="size-4 animate-spin" />
        <LogIn v-else class="size-4" />
        {{ isBusy ? t("auth.SIGNUP_SUBMIT_LOADING") : t("auth.SIGNUP_SUBMIT") }}
      </button>
    </form>

    <p class="border-t pt-5 text-center text-sm text-muted-foreground">
      {{ t("auth.HAVE_ACCOUNT") }}
      <NuxtLink
        to="/signin"
        class="ml-1 font-medium text-primary hover:underline"
      >
        {{ t("auth.SIGNIN_LINK") }}
      </NuxtLink>
    </p>
  </AuthShell>
</template>
