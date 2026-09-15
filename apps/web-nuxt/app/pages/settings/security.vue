<script setup lang="ts">
import SettingsSection from "@/components/settings/SettingsSection.vue";
import { useApiError } from "@/composables/useApiError";
import { useConfirm } from "@/composables/useConfirm";
import { useNotification } from "@/composables/useNotification";
import { useAuthStore } from "@/stores/auth";
import type { SessionInfo } from "@finwall/shared";
import {
  KeyRound,
  Laptop,
  Loader2,
  Lock,
  Smartphone,
  Tablet,
} from "lucide-vue-next";

definePageMeta({ layout: "settings", middleware: ["auth"] });

const authStore = useAuthStore();
const { notify } = useNotification();
const { resolve: resolveError } = useApiError();
const { confirm } = useConfirm();
const { t } = useI18n();

const sessions = ref<SessionInfo[]>([]);
const loadingSessions = ref(true);
const revokingId = ref<string | null>(null);
const revokingOthers = ref(false);

function deviceIcon(ua: string | null) {
  const s = (ua ?? "").toLowerCase();
  if (/iphone|android|mobile/.test(s)) return Smartphone;
  if (/ipad|tablet/.test(s)) return Tablet;
  return Laptop;
}

function deviceLabel(session: SessionInfo) {
  const s = (session.userAgent ?? "").toLowerCase();
  if (/edg\//.test(s)) return "Microsoft Edge";
  if (/chrome/.test(s)) return "Google Chrome";
  if (/firefox/.test(s)) return "Mozilla Firefox";
  if (/safari/.test(s)) return "Safari";
  return session.device || t("security.UNKNOWN_DEVICE");
}

/** Format waktu relatif sederhana untuk "terakhir aktif". */
function lastActive(session: SessionInfo) {
  const diff = Date.now() - new Date(session.lastActiveAt).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return t("security.JUST_NOW");
  if (minutes < 60) return t("security.MINUTES_AGO", { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("security.HOURS_AGO", { count: hours });
  return t("security.DAYS_AGO", { count: Math.round(hours / 24) });
}

async function loadSessions() {
  loadingSessions.value = true;
  try {
    sessions.value = await authStore.fetchSessions();
  } catch (err) {
    notify({ type: "danger", message: resolveError(err) });
  } finally {
    loadingSessions.value = false;
  }
}

async function revoke(session: SessionInfo) {
  const ok = await confirm({
    title: t("security.REVOKE"),
    message: t("security.REVOKE_CONFIRM"),
    variant: "danger",
    confirmText: t("security.REVOKE"),
  });
  if (!ok) return;

  revokingId.value = session.id;
  try {
    await authStore.revokeSession(session.id);
    if (!session.isCurrent) {
      notify({ type: "success", message: t("security.REVOKE_SUCCESS") });
      await loadSessions();
    }
  } catch (err) {
    notify({ type: "danger", message: resolveError(err) });
  } finally {
    revokingId.value = null;
  }
}

async function revokeOthers() {
  const ok = await confirm({
    title: t("security.REVOKE_OTHERS"),
    message: t("security.REVOKE_OTHERS_CONFIRM"),
    variant: "danger",
  });
  if (!ok) return;

  revokingOthers.value = true;
  try {
    await authStore.revokeOtherSessions();
    notify({ type: "success", message: t("security.REVOKE_OTHERS_SUCCESS") });
    await loadSessions();
  } catch (err) {
    notify({ type: "danger", message: resolveError(err) });
  } finally {
    revokingOthers.value = false;
  }
}

onMounted(loadSessions);
</script>

<template>
  <div class="space-y-5">
    <!-- Ganti Password -->
    <SettingsSection
      heading="lg"
      :title="t('security.CHANGE_PASSWORD')"
      :description="t('security.CHANGE_PASSWORD_DESC')"
    >
      <form class="space-y-4 sm:max-w-md" @submit.prevent>
        <div class="space-y-2">
          <label
            for="current-password"
            class="block text-sm font-medium text-foreground"
          >
            {{ t("security.CURRENT_PASSWORD") }}
          </label>
          <div class="relative">
            <span
              class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"
            >
              <Lock class="size-4" />
            </span>
            <input
              id="current-password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label
            for="new-password"
            class="block text-sm font-medium text-foreground"
          >
            {{ t("security.NEW_PASSWORD") }}
          </label>
          <div class="relative">
            <span
              class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"
            >
              <KeyRound class="size-4" />
            </span>
            <input
              id="new-password"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              class="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div class="pt-1">
          <button
            type="submit"
            disabled
            class="h-10 cursor-not-allowed rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground opacity-60 transition-colors"
          >
            {{ t("security.UPDATE_PASSWORD") }}
          </button>
        </div>
      </form>
    </SettingsSection>

    <!-- Sesi Aktif -->
    <SettingsSection
      :title="t('security.SESSIONS_TITLE')"
      :description="t('security.SESSIONS_SUBTITLE')"
    >
      <template #action>
        <button
          v-if="sessions.length > 1"
          type="button"
          :disabled="revokingOthers"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          @click="revokeOthers"
        >
          <Loader2 v-if="revokingOthers" class="size-3.5 animate-spin" />
          {{ t("security.REVOKE_OTHERS") }}
        </button>
      </template>

      <!-- Skeleton -->
      <div v-if="loadingSessions" class="flex flex-col gap-2">
        <div
          v-for="i in 2"
          :key="i"
          class="h-[72px] animate-pulse rounded-xl border bg-muted/40"
        />
      </div>

      <p
        v-else-if="sessions.length === 0"
        class="py-4 text-sm text-muted-foreground"
      >
        {{ t("security.EMPTY") }}
      </p>

      <div v-else class="flex flex-col gap-2">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="flex items-center gap-3 rounded-xl border p-3 transition-colors"
          :class="session.isCurrent && 'border-primary/40 bg-primary/5'"
        >
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
          >
            <component :is="deviceIcon(session.userAgent)" class="size-4" />
          </div>

          <div class="min-w-0 flex-1">
            <p class="flex items-center gap-2 truncate text-sm font-medium">
              {{ deviceLabel(session) }}
              <span
                v-if="session.isCurrent"
                class="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
              >
                {{ t("security.CURRENT_DEVICE") }}
              </span>
            </p>
            <p class="truncate text-xs text-muted-foreground">
              {{ session.ipAddress || "—" }} · {{ lastActive(session) }}
            </p>
          </div>

          <button
            v-if="!session.isCurrent"
            type="button"
            :disabled="revokingId === session.id"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            @click="revoke(session)"
          >
            <Loader2
              v-if="revokingId === session.id"
              class="size-3.5 animate-spin"
            />
            {{ t("security.REVOKE") }}
          </button>
        </div>
      </div>
    </SettingsSection>
  </div>
</template>
