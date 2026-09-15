<script setup lang="ts">
import AuthShell from '@/components/auth/AuthShell.vue'
import TextField from '@/components/auth/TextField.vue'
import { useApiError } from '@/composables/useApiError'
import { useNotification } from '@/composables/useNotification'
import { usePageLoading } from '@/composables/usePageLoading'
import { useTenant } from '@/composables/useTenant'
import { useAuthStore } from '@/stores/auth'
import {
  DEFAULT_WORKSPACE_TEMPLATE_ID,
  WORKSPACE_TEMPLATE_IDS,
  createTenantRequestSchema,
  type WorkspaceTemplateId,
} from '@finwall/shared'
import { toTypedSchema } from '@vee-validate/zod'
import {
  Briefcase,
  Building2,
  Check,
  Layers,
  Loader2,
  Plus,
  User,
  UsersRound,
} from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const { notify } = useNotification()
const { withLoading } = usePageLoading()
const { resolve: resolveError } = useApiError()
const { t } = useI18n()
const { landingPath } = useTenant()

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(createTenantRequestSchema),
  initialValues: {
    name: '',
    template: DEFAULT_WORKSPACE_TEMPLATE_ID as WorkspaceTemplateId,
  },
})

const [name, nameProps] = defineField('name')
const [template, templateProps] = defineField('template')

/** Ikon per template; label & contoh isi diambil dari i18n. */
const TEMPLATE_ICONS: Record<WorkspaceTemplateId, unknown> = {
  individual: User,
  family: UsersRound,
  business: Briefcase,
  blank: Layers,
}

/**
 * Pilihan template. Urutan mengikuti `WORKSPACE_TEMPLATE_IDS` dari shared agar
 * penambahan template baru di backend langsung ikut tampil di sini.
 */
const templateOptions = computed(() =>
  WORKSPACE_TEMPLATE_IDS.map((id) => ({
    id,
    icon: TEMPLATE_ICONS[id],
    title: t(`onboarding.TEMPLATE.${id.toUpperCase()}.TITLE`),
    description: t(`onboarding.TEMPLATE.${id.toUpperCase()}.DESCRIPTION`),
    examples: t(`onboarding.TEMPLATE.${id.toUpperCase()}.EXAMPLES`),
  })),
)

const isBusy = computed(() => isSubmitting.value || authStore.isLoading)

const onSubmit = handleSubmit(async (values) => {
  try {
    // `withLoading` menutup overlay otomatis, termasuk saat error.
    const created = await withLoading(() =>
      authStore.createTenant({
        name: values.name,
        template: values.template as WorkspaceTemplateId,
      }),
    )

    notify({
      type: 'success',
      title: t('onboarding.CREATE_SUCCESS_TITLE'),
      message: t('onboarding.CREATE_SUCCESS_MESSAGE', { name: values.name }),
    })

    const tenantId = created?.tenant?.publicId
    await router.push(tenantId ? `/t/${tenantId}/dashboard` : '/onboarding/create-workspace')
  } catch (err) {
    notify({ type: 'danger', message: resolveError(err) })
  }
})
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

      <!-- Template awal: menentukan akun & kategori yang dibuat otomatis. -->
      <fieldset class="w-full space-y-2">
        <legend class="text-sm font-medium text-foreground">
          {{ t('onboarding.TEMPLATE_LABEL') }}
        </legend>
        <p class="text-xs text-muted-foreground">
          {{ t('onboarding.TEMPLATE_HINT') }}
        </p>

        <div class="space-y-2" role="radiogroup">
          <label
            v-for="option in templateOptions"
            :key="option.id"
            class="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors"
            :class="
              template === option.id
                ? 'border-primary bg-primary/5'
                : 'border-input hover:bg-muted/60'
            "
          >
            <!-- Radio asli disembunyikan; aksesibilitas tetap terjaga lewat
          `peer` + `sr-only` dan seluruh kartu menjadi label. -->
            <input
              v-model="template"
              v-bind="templateProps"
              type="radio"
              :value="option.id"
              class="sr-only"
            />

            <span
              class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
              :class="
                template === option.id
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground'
              "
              aria-hidden="true"
            >
              <component :is="option.icon" class="size-4" />
            </span>

            <span class="min-w-0 flex-1">
              <span
                class="flex items-center gap-1.5 text-sm font-semibold"
                :class="template === option.id ? 'text-primary' : 'text-foreground'"
              >
                {{ option.title }}
                <Check v-if="template === option.id" class="size-3.5 shrink-0" />
              </span>
              <span class="mt-0.5 block text-xs text-muted-foreground">
                {{ option.description }}
              </span>
              <span class="mt-1 block text-[10px] leading-relaxed text-muted-foreground/80">
                {{ option.examples }}
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        :disabled="isBusy"
        class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <Loader2 v-if="isBusy" class="size-4 animate-spin" />
        <Plus v-else class="size-4" />
        {{ t('onboarding.CREATE_SUBMIT') }}
      </button>
    </form>

    <p class="border-t pt-5 text-center text-sm text-muted-foreground">
      {{ t('onboarding.HAS_INVITE') }}
      <RouterLink to="/onboarding/join" class="ml-1 font-medium text-primary hover:underline">
        {{ t('onboarding.JOIN_LINK') }}
      </RouterLink>
    </p>

    <template #below>
      <div class="text-center">
        <RouterLink
          v-if="authStore.isTenantSelected"
          :to="landingPath()"
          class="text-xs text-muted-foreground hover:underline"
        >
          {{ t('onboarding.BACK_TO_APP') }}
        </RouterLink>
        <RouterLink v-else to="/" class="text-xs text-muted-foreground hover:underline">
          {{ t('onboarding.BACK_TO_HOMEPAGE') }}
        </RouterLink>
      </div>
    </template>
  </AuthShell>
</template>
