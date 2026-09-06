import type {
  CurrentTenant,
  CurrentUser,
  SigninRequest,
  SignupRequest,
} from "@finwall/shared";
import { defineStore } from "pinia";

// Disimpan di luar store agar TIDAK ikut diserialisasi ke payload SSR.
// Jika diletakkan di dalam state Pinia, nilai `true` yang di-set saat SSR
// akan di-hydrate ke client sehingga client melewatkan fetchMe() setelah reload.
let _initialized = false;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as CurrentUser | null,
    currentTenant: null as CurrentTenant | null,
    isLoading: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    hasTenant: (state) => !!state.currentTenant?.publicId,
    initialized: () => _initialized,
  },
  actions: {
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
        this.user = res.data.user;
        this.currentTenant = res.data.tenant;
      } finally {
        this.isLoading = false;
      }
    },

    async signIn(req: SigninRequest) {
      const { $api } = useNuxtApp();
      try {
        this.isLoading = true;
        const res = await $api.post("/auth/signin", req);
        this.user = res.data.user;
        this.currentTenant = res.data.tenant;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMe() {
      const { $api } = useNuxtApp();
      try {
        this.isLoading = true;
        const res = await $api.get("/auth/me");
        this.user = res.data.user;
        this.currentTenant = res.data.tenant;
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
        // Tetap set true agar middleware tidak memanggil fetchMe lagi setelah logout
        _initialized = true;
        if (import.meta.client) {
          await navigateTo("/signin");
        }
      }
    },
  },
});
