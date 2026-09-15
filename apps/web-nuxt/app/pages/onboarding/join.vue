<script setup lang="ts">
import AuthShell from "@/components/auth/AuthShell.vue";
import TextField from "@/components/auth/TextField.vue";
import { useApiError } from "@/composables/useApiError";
import { useNotification } from "@/composables/useNotification";
import { useAuthStore } from "@/stores/auth";
import { joinTenantRequestSchema } from "@finwall/shared";
import { toTypedSchema } from "@vee-validate/zod";
import { KeyRound, Loader2, LogIn } from "lucide-vue-next";
import { useForm } from "vee-validate";

definePageMeta({
  layout: false,
  // Onboarding butuh login, tetapi berada DI LUAR konteks tenant (user belum
  // punya workspace) — karena itu memakai middleware "auth", bukan "tenant".
  middleware: "auth",
});

const authStore = useAuthStore();
const { notify } = useNotification();
const { withLoading } = usePageLoading();
const { resolve: resolveError } = useApiError();
const { t } = useI18n();

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(joinTenantRequestSchema),
  initialValues: { code: "" },
});

const [code, codeProps] = defineField("code");

/** Format kode undangan jadi `XXXX-XXXX` sambil diketik. */
function formatCode(raw: string) {
  const clean = raw
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

const isBusy = computed(() => isSubmitting.value || authStore.isLoading);

const onSubmit = handleSubmit(async (values) => {
  try {
    const joined = await withLoading(() =>
      authStore.joinByCode({ code: values.code }),
    );

    notify({
      type: "success",
      title: t("onboarding.JOIN_SUCCESS_TITLE"),
      message: t("onboarding.JOIN_SUCCESS_MESSAGE"),
    });

    const tenantId = joined?.tenant?.publicId;
    await navigateTo(
      tenantId ? `/t/${tenantId}/dashboard` : "/onboarding/create-workspace",
    );
  } catch (err) {
    notify({ type: "danger", message: resolveError(err) });
  }
});
</script>

<template>
  <AuthShell
    :title="t('onboarding.JOIN_TITLE')"
    :subtitle="t('onboarding.JOIN_SUBTITLE')"
    :icon="KeyRound"
  >
    <form class="space-y-5" @submit.prevent="onSubmit">
      <TextField
        id="code"
        v-model="code"
        v-bind="codeProps"
        code
        :label="t('onboarding.CODE_LABEL')"
        :placeholder="t('onboarding.CODE_PLACEHOLDER')"
        :maxlength="9"
        autocapitalize="characters"
        :format="formatCode"
        :error="errors.code"
        :hint="t('onboarding.CODE_HINT')"
      />

      <button
        type="submit"
        :disabled="isBusy || !code"
        class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <Loader2 v-if="isBusy" class="size-4 animate-spin" />
        <LogIn v-else class="size-4" />
        {{ t("onboarding.JOIN_SUBMIT") }}
      </button>
    </form>

    <p class="border-t pt-5 text-center text-sm text-muted-foreground">
      {{ t("onboarding.NO_INVITE") }}
      <NuxtLink
        to="/onboarding/create-workspace"
        class="ml-1 font-medium text-primary hover:underline"
      >
        {{ t("onboarding.CREATE_LINK") }}
      </NuxtLink>
    </p>

    <template #below>
      <div class="text-center">
        <button
          type="button"
          class="text-xs text-muted-foreground transition-colors hover:text-foreground"
          @click="authStore.logout()"
        >
          {{ t("onboarding.LOGOUT") }}
        </button>
      </div>
    </template>
  </AuthShell>
</template>
