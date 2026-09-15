<script setup lang="ts">
import AuthShell from "@/components/auth/AuthShell.vue";
import TextField from "@/components/auth/TextField.vue";
import { useApiError } from "@/composables/useApiError";
import { useNotification } from "@/composables/useNotification";
import { useAuthStore } from "@/stores/auth";
import { signinRequestSchema } from "@finwall/shared";
import { toTypedSchema } from "@vee-validate/zod";
import { KeyRound, Loader2, Lock, LogIn, User } from "lucide-vue-next";
import { useForm } from "vee-validate";

definePageMeta({
  layout: false,
  middleware: "guest",
});

const authStore = useAuthStore();
const route = useRoute();
const { landingPath } = useTenant();
const { notify, notifyAfterReload } = useNotification();
const { resolve: resolveError } = useApiError();
const { t } = useI18n();

const errorMessage = ref<string | null>(null);

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(signinRequestSchema),
  initialValues: {
    identifier: "",
    password: "",
  },
});

const [identifier, identifierProps] = defineField("identifier");
const [password, passwordProps] = defineField("password");

const isBusy = computed(() => isSubmitting.value || authStore.isLoading);

const onSubmit = handleSubmit(async (values) => {
  errorMessage.value = null;

  try {
    await authStore.signIn({
      identifier: values.identifier,
      password: values.password,
    });
    notifyAfterReload({
      type: "success",
      title: t("auth.SIGNIN_SUCCESS_TITLE"),
      message: t("auth.SIGNIN_SUCCESS_MESSAGE", {
        identifier: values.identifier,
      }),
    });

    // Navigasi SPA (bukan full reload) supaya state sesi tetap hidup.
    // Tenant aktif ditentukan URL tenant; `landingPath` memilih workspace
    // terakhir dipakai (preferensi session) atau onboarding.
    const redirect = route.query.redirect;
    if (typeof redirect === "string" && redirect.startsWith("/")) {
      await navigateTo(redirect);
    } else {
      await navigateTo(landingPath());
    }
  } catch (err) {
    const message = resolveError(err);
    notify({ type: "danger", message });
    errorMessage.value = message;
  }
});
</script>

<template>
  <AuthShell
    :title="t('auth.SIGNIN_TITLE')"
    :subtitle="t('auth.SIGNIN_SUBTITLE')"
    :icon="LogIn"
  >
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

      <TextField
        id="password"
        v-model="password"
        v-bind="passwordProps"
        :label="t('auth.PASSWORD_LABEL')"
        placeholder="••••••••"
        :icon="Lock"
        autocomplete="current-password"
        password-toggle
        :error="errors.password"
      >
        <template #labelAction>
          <NuxtLink
            to="/forgot-password"
            class="text-xs font-medium text-primary hover:underline"
          >
            {{ t("auth.FORGOT_PASSWORD") }}
          </NuxtLink>
        </template>
      </TextField>

      <button
        type="submit"
        :disabled="isBusy"
        class="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <Loader2 v-if="isBusy" class="size-4 animate-spin" />
        <LogIn v-else class="size-4" />
        {{ isBusy ? t("auth.SUBMIT_LOADING") : t("auth.SUBMIT") }}
      </button>
    </form>

    <p class="border-t pt-5 text-center text-sm text-muted-foreground">
      {{ t("auth.NO_ACCOUNT") }}
      <NuxtLink
        to="/signup"
        class="ml-1 font-medium text-primary hover:underline"
      >
        {{ t("auth.SIGNUP_LINK") }}
      </NuxtLink>
    </p>
  </AuthShell>
</template>
