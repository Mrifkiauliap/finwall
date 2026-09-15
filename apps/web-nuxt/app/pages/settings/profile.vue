<script setup lang="ts">
import SettingsSection from "@/components/settings/SettingsSection.vue";
import { useAuthStore } from "@/stores/auth";
import { Camera, Mail, User } from "lucide-vue-next";

definePageMeta({ layout: "settings", middleware: ["auth"] });

const authStore = useAuthStore();
const { t } = useI18n();

// TODO: sambungkan ke endpoint update-profile (form state, submit handler, upload avatar).
const username = ref(authStore.user?.username ?? "");
const email = ref(authStore.user?.email ?? "");

const initial = computed(() =>
  (authStore.user?.username ?? authStore.user?.email ?? "?").charAt(0),
);
</script>

<template>
  <div class="space-y-5">
    <SettingsSection
      heading="lg"
      :title="t('settings.profile.ACCOUNT_TITLE')"
      :description="t('settings.profile.ACCOUNT_SUBTITLE')"
    >
      <div class="flex flex-wrap items-center gap-5">
        <div class="relative">
          <img
            v-if="authStore.user?.avatarUrl"
            :src="authStore.user.avatarUrl"
            alt=""
            class="size-20 rounded-full object-cover ring-2 ring-border"
          />
          <div
            v-else
            class="flex size-20 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold uppercase text-primary ring-2 ring-border"
          >
            {{ initial }}
          </div>
        </div>

        <div class="min-w-0">
          <button
            type="button"
            disabled
            class="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium opacity-60 transition-colors"
          >
            <Camera class="size-4" />
            {{ t("settings.profile.CHANGE_PHOTO") }}
          </button>
          <p class="mt-1.5 text-xs text-muted-foreground">
            {{ t("settings.profile.PHOTO_HINT") }}
          </p>
        </div>
      </div>
    </SettingsSection>

    <SettingsSection
      :title="t('settings.profile.INFO_TITLE')"
      :description="t('settings.profile.INFO_SUBTITLE')"
    >
      <form class="space-y-4 sm:max-w-md" @submit.prevent>
        <!-- Username -->
        <div class="space-y-2">
          <label
            for="profile-username"
            class="block text-sm font-medium text-foreground"
          >
            {{ t("settings.profile.USERNAME") }}
          </label>
          <div class="relative">
            <span
              class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"
            >
              <User class="size-4" />
            </span>
            <input
              id="profile-username"
              v-model="username"
              type="text"
              autocomplete="username"
              class="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <label
            for="profile-email"
            class="block text-sm font-medium text-foreground"
          >
            {{ t("settings.profile.EMAIL") }}
          </label>
          <div class="relative">
            <span
              class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"
            >
              <Mail class="size-4" />
            </span>
            <input
              id="profile-email"
              v-model="email"
              type="email"
              autocomplete="email"
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
            {{ t("settings.profile.SAVE") }}
          </button>
        </div>
      </form>
    </SettingsSection>
  </div>
</template>
