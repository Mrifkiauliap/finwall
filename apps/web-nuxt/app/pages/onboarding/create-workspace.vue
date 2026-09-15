<script setup lang="ts">
import AuthShell from "@/components/auth/AuthShell.vue";
import TextField from "@/components/auth/TextField.vue";
import { useApiError } from "@/composables/useApiError";
import { useNotification } from "@/composables/useNotification";
import { useAuthStore } from "@/stores/auth";
import { createTenantRequestSchema } from "@finwall/shared";
import { toTypedSchema } from "@vee-validate/zod";
import { Building2, Loader2, Plus } from "lucide-vue-next";
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
  validationSchema: toTypedSchema(createTenantRequestSchema),
  initialValues: { name: "" },
});

const [name, nameProps] = defineField("name");

const isBusy = computed(() => isSubmitting.value || authStore.isLoading);

const onSubmit = handleSubmit(async (values) => {
  try {
    // `withLoading` menutup overlay otomatis, termasuk saat error.
    const created = await withLoading(() =>
      authStore.createTenant({ name: values.name }),
    );

    notify({
      type: "success",
      title: t("onboarding.CREATE_SUCCESS_TITLE"),
      message: t("onboarding.CREATE_SUCCESS_MESSAGE", { name: values.name }),
    });

    // Navigasi SPA ke tenant baru — tidak perlu full reload karena konteks
    // tenant berasal dari URL dan middleware akan memuat datanya.
    const tenantId = created?.tenant?.publicId;
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
    :title="t('onboarding.CREATE_TITLE')"
    :subtitle="t('onboarding.CREATE_SUBTITLE')"
    :icon="Building2"
  >
    <form class="space-y-5" @submit.prevent="onSubmit">
      <TextField
        id="name"
        v-model="name"
        v-bind="nameProps"
        :label="t('onboarding.NAME_LABEL')"
        :placeholder="t('onboarding.NAME_PLACEHOLDER')"
        autocomplete="organization"
        :maxlength="100"
        :error="errors.name"
        :hint="t('onboarding.NAME_HINT')"
      />

      <button
        type="submit"
        :disabled="isBusy"
        class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <Loader2 v-if="isBusy" class="size-4 animate-spin" />
        <Plus v-else class="size-4" />
        {{ t("onboarding.CREATE_SUBMIT") }}
      </button>
    </form>

    <p class="border-t pt-5 text-center text-sm text-muted-foreground">
      {{ t("onboarding.HAS_INVITE") }}
      <NuxtLink
        to="/onboarding/join"
        class="ml-1 font-medium text-primary hover:underline"
      >
        {{ t("onboarding.JOIN_LINK") }}
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
