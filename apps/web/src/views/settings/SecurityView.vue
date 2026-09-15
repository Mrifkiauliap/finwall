<script setup lang="ts">
import { useApiError } from '@/composables/useApiError'
import { useConfirm } from '@/composables/useConfirm'
import { useNotification } from '@/composables/useNotification'
import { useAuthStore } from '@/stores/auth'
import type { SessionInfo } from '@finwall/shared'
import { KeyRound, Loader2, Monitor, ShieldCheck, Trash2 } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { confirm } = useConfirm()
const { notify } = useNotification()
const { resolve: resolveError } = useApiError()
const { t } = useI18n()

const sessions = ref<SessionInfo[]>([])
const isLoading = ref(false)
const busyId = ref<string | null>(null)
const revokingOthers = ref(false)

async function loadSessions() {
  isLoading.value = true
  try {
    sessions.value = await authStore.fetchSessions()
  } catch (err) {
    notify({ type: 'danger', message: resolveError(err) })
  } finally {
    isLoading.value = false
  }
}

onMounted(loadSessions)

async function revoke(session: SessionInfo) {
  const ok = await confirm({
    title: t('security.REVOKE'),
    message: t('security.REVOKE_CONFIRM'),
    variant: 'danger',
  })
  if (!ok) return

  busyId.value = session.id
  try {
    await authStore.revokeSession(session.id)
    notify({ type: 'success', message: t('security.REVOKE_SUCCESS') })
    // Bila sesi saat ini yang dicabut, store sudah mengarahkan ke /signin.
    await loadSessions()
  } catch (err) {
    notify({ type: 'danger', message: resolveError(err) })
  } finally {
    busyId.value = null
  }
}

async function revokeOthers() {
  const ok = await confirm({
    title: t('security.REVOKE_OTHERS'),
    message: t('security.REVOKE_OTHERS_CONFIRM'),
    variant: 'danger',
  })
  if (!ok) return

  revokingOthers.value = true
  try {
    await authStore.revokeOtherSessions()
    notify({ type: 'success', message: t('security.REVOKE_OTHERS_SUCCESS') })
    await loadSessions()
  } catch (err) {
    notify({ type: 'danger', message: resolveError(err) })
  } finally {
    revokingOthers.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Password -->
    <section class="rounded-xl border bg-card p-6 text-card-foreground shadow-elevation-sm">
      <div class="flex items-start gap-3">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
        >
          <KeyRound class="size-5" />
        </div>
        <div class="flex-1">
          <h2 class="text-base font-semibold">{{ t('security.CHANGE_PASSWORD') }}</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ t('security.CHANGE_PASSWORD_DESC') }}
          </p>
          <button
            type="button"
            disabled
            class="mt-4 inline-flex h-9 items-center rounded-lg border border-input px-4 text-sm font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ t('security.UPDATE_PASSWORD') }}
          </button>
        </div>
      </div>
    </section>

    <!-- Sesi aktif -->
    <section class="rounded-xl border bg-card p-6 text-card-foreground shadow-elevation-sm">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          >
            <ShieldCheck class="size-5" />
          </div>
          <div>
            <h2 class="text-base font-semibold">{{ t('security.SESSIONS_TITLE') }}</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ t('security.SESSIONS_SUBTITLE') }}
            </p>
          </div>
        </div>

        <button
          type="button"
          class="hidden shrink-0 items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60 sm:inline-flex"
          :disabled="revokingOthers || sessions.length < 2"
          @click="revokeOthers"
        >
          <Loader2 v-if="revokingOthers" class="size-4 animate-spin" />
          {{ t('security.REVOKE_OTHERS') }}
        </button>
      </div>

      <div v-if="isLoading" class="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 class="size-4 animate-spin" />
        {{ t('common.MESSAGE.PROCESSING') }}
      </div>

      <p v-else-if="sessions.length === 0" class="mt-5 text-sm text-muted-foreground">
        {{ t('security.EMPTY') }}
      </p>

      <ul v-else class="mt-5 divide-y rounded-xl border">
        <li v-for="session in sessions" :key="session.id" class="flex items-center gap-3 p-4">
          <Monitor class="size-4 shrink-0 text-muted-foreground" />

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">
              {{ session.device || session.userAgent || '-' }}
            </p>
            <p class="truncate text-xs text-muted-foreground">
              {{ session.ipAddress || '-' }}
            </p>
          </div>

          <span
            v-if="session.isCurrent"
            class="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
          >
            {{ t('security.CURRENT_DEVICE') }}
          </span>

          <button
            v-else
            type="button"
            class="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            :disabled="busyId === session.id"
            :aria-label="t('security.REVOKE')"
            @click="revoke(session)"
          >
            <Loader2 v-if="busyId === session.id" class="size-4 animate-spin" />
            <Trash2 v-else class="size-4" />
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
