<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { UserRound } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t } = useI18n()

const initial = computed(() =>
  (authStore.user?.username ?? authStore.user?.email ?? '?').charAt(0).toUpperCase(),
)
</script>

<template>
  <div class="space-y-6">
    <!-- Foto profil -->
    <section class="rounded-xl border bg-card p-6 text-card-foreground shadow-elevation-sm">
      <h2 class="text-base font-semibold">{{ t('settings.profile.ACCOUNT_TITLE') }}</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ t('settings.profile.ACCOUNT_SUBTITLE') }}
      </p>

      <div class="mt-4 flex items-center gap-4">
        <img
          v-if="authStore.user?.avatarUrl"
          :src="authStore.user.avatarUrl"
          alt=""
          class="size-16 rounded-full object-cover"
        />
        <div
          v-else
          class="flex size-16 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary"
        >
          {{ initial }}
        </div>

        <div class="space-y-1">
          <button
            type="button"
            disabled
            class="inline-flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserRound class="size-4" />
            {{ t('settings.profile.CHANGE_PHOTO') }}
          </button>
          <p class="text-xs text-muted-foreground">
            {{ t('settings.profile.PHOTO_HINT') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Informasi akun -->
    <section class="rounded-xl border bg-card p-6 text-card-foreground shadow-elevation-sm">
      <h2 class="text-base font-semibold">{{ t('settings.profile.INFO_TITLE') }}</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ t('settings.profile.INFO_SUBTITLE') }}
      </p>

      <dl class="mt-4 grid gap-4 sm:grid-cols-2">
        <div class="space-y-1">
          <dt class="text-sm font-medium">{{ t('settings.profile.USERNAME') }}</dt>
          <dd class="text-sm text-muted-foreground">
            {{ authStore.user?.username ?? '-' }}
          </dd>
        </div>
        <div class="space-y-1">
          <dt class="text-sm font-medium">{{ t('settings.profile.EMAIL') }}</dt>
          <dd class="text-sm text-muted-foreground">{{ authStore.user?.email ?? '-' }}</dd>
        </div>
      </dl>

      <button
        type="button"
        disabled
        class="mt-5 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ t('settings.profile.SAVE') }}
      </button>
    </section>
  </div>
</template>
