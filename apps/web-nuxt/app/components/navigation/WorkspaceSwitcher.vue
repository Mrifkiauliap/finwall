<!-- app/components/navigation/WorkspaceSwitcher.vue -->
<script setup lang="ts">
import { useApiError } from "@/composables/useApiError";
import { useNotification } from "@/composables/useNotification";
import { useAuthStore } from "@/stores/auth";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-vue-next";

withDefaults(
  defineProps<{
    /** Mode kompak untuk dipasang di header (tanpa subtitle). */
    compact?: boolean;
  }>(),
  { compact: false },
);

const authStore = useAuthStore();
const { tenantPublicId } = useTenant();
const { notify } = useNotification();
const { withLoading } = usePageLoading();
const { resolve: resolveError } = useApiError();
const { t } = useI18n();

const isOpen = ref(false);
const rootEl = ref<HTMLElement | null>(null);
const loadError = ref<string | null>(null);

function toggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) ensureTenants();
}

function close() {
  isOpen.value = false;
}

function onClickOutside(e: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) close();
}

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside));

const switching = ref(false);

// Tenant aktif ditentukan oleh URL, bukan oleh session store.
const activeTenant = computed(
  () =>
    authStore.tenants.find((x) => x.publicId === tenantPublicId.value) ?? null,
);

const activeName = computed(
  () =>
    activeTenant.value?.name ??
    authStore.currentTenant?.name ??
    t("workspace.NO_WORKSPACE"),
);

const activeRole = computed(
  () => activeTenant.value?.role ?? authStore.currentTenant?.role ?? "-",
);

const initial = computed(() =>
  (activeName.value || "F").charAt(0).toUpperCase(),
);

/** Ambil daftar tenant (sekali; tombol retry memakai force). */
async function ensureTenants(force = false) {
  if (authStore.tenantsLoaded && !force) return;
  if (!authStore.isAuthenticated) return;
  loadError.value = null;
  try {
    await authStore.fetchTenants(force);
  } catch (err) {
    loadError.value = resolveError(err);
  }
}

/**
 * Muat ulang daftar tenant sambil menampilkan overlay loading, agar kegagalan
 * atau jeda jaringan tidak membuat dropdown tampak kosong tanpa penjelasan.
 */
async function reloadTenants() {
  try {
    await withLoading(() => authStore.fetchTenants(true));
  } catch (err) {
    loadError.value = resolveError(err);
  }
}

// Ambil di awal supaya tombol langsung menampilkan nama workspace tanpa perlu
// dibuka dulu. Pakai watch (bukan hanya onMounted) karena saat hard reload
// `isAuthenticated` baru menjadi true setelah plugin auth-restore selesai.
watch(
  () => authStore.isAuthenticated,
  (isAuthed) => {
    if (isAuthed) ensureTenants();
  },
  { immediate: true },
);

/**
 * Pindah workspace = pindah URL tenant. Navigasi SPA (bukan full reload) karena
 * tenant aktif kini berasal dari URL, bukan dari state session global.
 */
async function selectTenant(tenantId: string) {
  if (tenantId === tenantPublicId.value) {
    close();
    return;
  }

  // Ambil nama SEBELUM switch: `switchTenant` sengaja mengosongkan cache daftar
  // tenant, jadi pencarian setelahnya akan gagal dan notifikasi kehilangan nama.
  const targetName =
    authStore.tenants.find((x) => x.publicId === tenantId)?.name ?? "";

  switching.value = true;
  close();

  try {
    // Simpan preferensi "workspace terakhir" (best-effort).
    if (authStore.currentTenant?.publicId !== tenantId) {
      await authStore.switchTenant({ tenantId });
    }

    await navigateTo(`/t/${tenantId}/dashboard`);

    notify({
      type: "success",
      title: t("workspace.SWITCH_SUCCESS_TITLE"),
      message: t("workspace.SWITCH_SUCCESS_MESSAGE", {
        name: targetName || authStore.currentTenant?.name || "",
      }),
    });

    // Daftar tenant dimuat ulang oleh middleware `tenant` pada rute tujuan
    // (`switchTenant` membuang cache, jadi middleware akan fetch sekali di sana).
  } catch (err) {
    notify({ type: "danger", message: resolveError(err) });
  } finally {
    switching.value = false;
  }
}
</script>

<template>
  <div ref="rootEl" class="relative">
    <!-- Trigger -->
    <button
      type="button"
      class="flex items-center text-left transition-colors"
      :class="
        compact
          ? 'gap-2 rounded-lg px-2 py-1.5 hover:bg-muted'
          : 'w-full gap-2.5 rounded-lg px-3 py-2 hover:bg-sidebar-accent'
      "
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <div
        class="flex shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground"
        :class="compact ? 'size-6 text-[10px]' : 'size-8 text-xs'"
      >
        {{ initial }}
      </div>

      <div v-if="compact" class="min-w-0">
        <p class="truncate text-sm font-semibold leading-tight">
          {{ activeName }}
        </p>
      </div>
      <template v-else>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold leading-tight">
            {{ activeName }}
          </p>
          <p class="truncate text-xs capitalize text-muted-foreground">
            {{ activeRole }}
          </p>
        </div>
      </template>

      <Loader2
        v-if="switching"
        class="size-4 shrink-0 animate-spin text-muted-foreground"
      />
      <ChevronsUpDown v-else class="size-4 shrink-0 text-muted-foreground" />
    </button>

    <Transition name="ws-fade">
      <div
        v-if="isOpen"
        class="absolute left-0 z-50 mt-1 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg"
        :class="compact ? 'w-64 max-w-[85vw]' : 'right-0'"
        role="listbox"
      >
        <p
          class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {{ t("workspace.LIST_TITLE") }}
        </p>

        <!-- Loading -->
        <div
          v-if="authStore.tenantsLoading"
          class="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground"
        >
          <Loader2 class="size-4 animate-spin" />
          {{ t("common.MESSAGE.PROCESSING") }}
        </div>

        <!-- Error -->
        <div v-else-if="loadError" class="px-3 py-2">
          <p class="text-sm text-destructive">{{ loadError }}</p>
          <button
            type="button"
            class="mt-1 text-xs font-medium text-primary hover:underline"
            @click="reloadTenants()"
          >
            {{ t("workspace.RETRY") }}
          </button>
        </div>

        <!-- List -->
        <template v-else>
          <button
            v-for="tenant in authStore.tenants"
            :key="tenant.publicId"
            type="button"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
            :disabled="switching"
            role="option"
            :aria-selected="tenant.publicId === tenantPublicId"
            @click="selectTenant(tenant.publicId)"
          >
            <span class="min-w-0 flex-1 truncate text-left font-medium">
              {{ tenant.name }}
            </span>
            <span class="text-xs capitalize text-muted-foreground">
              {{ tenant.role }}
            </span>
            <Check
              v-if="tenant.publicId === tenantPublicId"
              class="size-4 text-primary"
            />
          </button>

          <div
            v-if="authStore.tenants.length === 0"
            class="px-3 py-2 text-sm text-muted-foreground"
          >
            {{ t("workspace.EMPTY") }}
          </div>
        </template>

        <div class="my-1 border-t" />

        <NuxtLink
          to="/onboarding/create-workspace"
          class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          @click="close"
        >
          <Plus class="size-4 text-muted-foreground" />
          {{ t("workspace.CREATE_NEW") }}
        </NuxtLink>
        <NuxtLink
          to="/onboarding/join"
          class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          @click="close"
        >
          <Plus class="size-4 text-muted-foreground" />
          {{ t("workspace.JOIN") }}
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ws-fade-enter-active,
.ws-fade-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.1s ease;
}
.ws-fade-enter-from,
.ws-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
