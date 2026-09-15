import type {
  CreateTenantRequest,
  CurrentTenant,
  CurrentUser,
  JoinTenantRequest,
  SessionInfo,
  SigninRequest,
  SignupRequest,
  SwitchTenantRequest,
  TenantAuthResponse,
  TenantInfo,
} from "@finwall/shared";
import { defineStore } from "pinia";

// Disimpan di luar store agar TIDAK ikut diserialisasi ke payload SSR.
// Jika diletakkan di dalam state Pinia, nilai `true` yang di-set saat SSR
// akan di-hydrate ke client sehingga client melewatkan fetchMe() setelah reload.
let _initialized = false;

interface AuthLike {
  user: CurrentUser;
  tenant: CurrentTenant;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as CurrentUser | null,
    currentTenant: null as CurrentTenant | null,
    tenants: [] as TenantInfo[],
    isLoading: false,
    // Menandai daftar tenant sudah pernah diambil (agar switcher tak fetch
    // berulang setiap kali dibuka).
    tenantsLoaded: false,
    tenantsLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    initialized: () => _initialized,
  },

  actions: {
    /** Sinkronkan state dari respons auth (signin/signup/tenant ops). */
    _applyAuth(result: AuthLike) {
      this.user = result.user;
      this.currentTenant = result.tenant;
    },

    /** Setelah berganti/membuat tenant, cache daftar tenant harus dibuang. */
    _applyTenantSwitch(result: TenantAuthResponse) {
      this._applyAuth(result);
      this.tenants = [];
      this.tenantsLoaded = false;
    },

    /**
     * Restore sesi dari cookie (httpOnly) sekali per boot. Aman dipanggil
     * berulang: tidak akan hit API lagi setelah initialized.
     *
     * Hanya berjalan di sisi CLIENT: di server axios tidak membawa cookie
     * browser (origin berbeda) sehingga /auth/me selalu 401, dan menandai
     * `initialized` di server akan membuat client melewatkan fetch saat
     * hydrasi. Biarkan client (browser) yang me-restore & verifikasi token.
     */
    async init() {
      if (import.meta.server) return;
      if (_initialized) return;
      _initialized = true;
      await this.fetchMe();
    },

    async signUp(req: SignupRequest) {
      const { $api } = useNuxtApp();
      try {
        this.isLoading = true;
        const res = await $api.post("/auth/signup", req);
        this._applyAuth(res.data);
      } finally {
        this.isLoading = false;
      }
    },

    async signIn(req: SigninRequest) {
      const { $api } = useNuxtApp();
      try {
        this.isLoading = true;
        const res = await $api.post("/auth/signin", req);
        this._applyAuth(res.data);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMe() {
      const { $api } = useNuxtApp();
      try {
        this.isLoading = true;
        const res = await $api.get("/auth/me");
        this._applyAuth(res.data);
      } catch {
        this.user = null;
        this.currentTenant = null;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      const { $api } = useNuxtApp();
      try {
        await $api.post("/auth/logout");
      } finally {
        this.user = null;
        this.currentTenant = null;
        this.tenants = [];
        this.tenantsLoaded = false;
        // Tetap set true agar middleware tidak memanggil fetchMe lagi setelah logout
        _initialized = true;
        if (import.meta.client) {
          await navigateTo("/signin");
        }
      }
    },

    // -------------------------------------------------------------------------
    // Tenant (workspace)
    // -------------------------------------------------------------------------

    /**
     * Semua workspace yang bisa diakses user (dengan role masing-masing).
     * `force` memaksa ambil ulang meski sudah pernah dimuat.
     */
    async fetchTenants(force = false) {
      if (this.tenantsLoaded && !force) return this.tenants;

      const { $api } = useNuxtApp();
      this.tenantsLoading = true;
      try {
        const res = await $api.get("/tenants");
        this.tenants = res.data.tenants;
        this.tenantsLoaded = true;
        return this.tenants;
      } finally {
        this.tenantsLoading = false;
      }
    },

    /** Buat workspace baru (user jadi owner) lalu jadikan aktif. */
    async createTenant(req: CreateTenantRequest) {
      const { $api } = useNuxtApp();
      try {
        this.isLoading = true;
        const res = await $api.post("/tenants", req);
        this._applyTenantSwitch(res.data);
        return res.data as TenantAuthResponse;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Set tenant "terakhir dipakai" sebagai preferensi session.
     *
     * Tenant aktif sendiri ditentukan URL (`/t/{tenantPublicId}/...`); endpoint
     * ini hanya menyimpan preferensi untuk redirect setelah login.
     */
    async switchTenant(req: SwitchTenantRequest) {
      const { $api } = useNuxtApp();
      try {
        this.isLoading = true;
        const res = await $api.post(`/tenants/${req.tenantId}/switch`);
        this._applyTenantSwitch(res.data);
        return res.data as TenantAuthResponse;
      } finally {
        this.isLoading = false;
      }
    },

    /** Gabung workspace lewat kode undangan. */
    async joinByCode(req: JoinTenantRequest) {
      const { $api } = useNuxtApp();
      try {
        this.isLoading = true;
        const res = await $api.post("/auth/tenant/join", req);
        this._applyTenantSwitch(res.data);
        return res.data;
      } finally {
        this.isLoading = false;
      }
    },

    // -------------------------------------------------------------------------
    // Sessions (perangkat) — halaman Keamanan
    // -------------------------------------------------------------------------

    async fetchSessions(): Promise<SessionInfo[]> {
      const { $api } = useNuxtApp();
      const res = await $api.get("/auth/sessions");
      return res.data.sessions;
    },

    async revokeSession(sessionId: string) {
      const { $api } = useNuxtApp();
      const res = await $api.delete(`/auth/sessions/${sessionId}`);
      // Session saat ini di-revoke -> paksa logout.
      if (res.data?.revokedCurrent) {
        this.user = null;
        this.currentTenant = null;
        if (import.meta.client) await navigateTo("/signin");
      }
      return res.data;
    },

    async revokeOtherSessions() {
      const { $api } = useNuxtApp();
      const res = await $api.post("/auth/sessions/revoke-others");
      return res.data;
    },
  },
});
