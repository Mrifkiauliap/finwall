import { navigate, navigateWithRedirect } from '@/lib/navigation'
import { api } from '@/services/api'
import type {
  CreateTenantRequest,
  CurrentTenant,
  CurrentUser,
  ForgotPasswordRequest,
  JoinTenantRequest,
  ResendVerificationResponse,
  ResetPasswordRequest,
  SessionInfo,
  SigninRequest,
  SignupRequest,
  SwitchTenantRequest,
  TenantAuthResponse,
  TenantInfo,
  VerifyEmailResponse,
} from '@finwall/shared'
import { defineStore } from 'pinia'

/**
 * Sesi hanya perlu di-restore sekali per pemuatan halaman.
 *
 * Ditulis di modul (bukan state Pinia) agar nilai `true` dari satu render tidak
 * ikut terserialisasi ke state mana pun.
 */
let _initialized = false

interface AuthResult {
  user: CurrentUser
  tenant: CurrentTenant
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as CurrentUser | null,
    currentTenant: null as CurrentTenant | null,
    tenants: [] as TenantInfo[],
    isLoading: false,
    tenantsLoaded: false,
    tenantsLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isTenantSelected: (state) => !!state.currentTenant,
    initialized: () => _initialized,
    needsEmailVerification: (state) => !!state.user && !state.user.isVerified,
    emailVerified: (state) => state.user?.isVerified ?? false,
  },

  actions: {
    /** Sinkronkan state dari respons auth (signin/signup/tenant ops). */
    _applyAuth(result: AuthResult) {
      this.user = result.user
      this.currentTenant = result.tenant
    },

    /** Setelah berganti/membuat tenant, cache daftar tenant harus dibuang. */
    _applyTenantSwitch(result: TenantAuthResponse) {
      this._applyAuth(result)
      this.tenants = []
      this.tenantsLoaded = false
    },

    /**
     * Restore sesi dari httpOnly cookie, sekali per pemuatan halaman.
     * Idempoten: setelah sukses/gagal, pemanggilan berikutnya tidak menghit API.
     */
    async init() {
      if (_initialized) return
      _initialized = true
      await this.fetchMe()
    },

    async signUp(req: SignupRequest) {
      try {
        this.isLoading = true
        const res = await api.post('/auth/signup', req)
        this._applyAuth(res.data)
      } finally {
        this.isLoading = false
      }
    },

    async signIn(req: SigninRequest) {
      try {
        this.isLoading = true
        const res = await api.post('/auth/signin', req)
        this._applyAuth(res.data)
      } finally {
        this.isLoading = false
      }
    },

    async forgotPassword(req: ForgotPasswordRequest): Promise<{ msg: string }> {
      const res = await api.post('/auth/forgot-password', req)
      return res.data as { msg: string }
    },

    async verifyForgotPasswordToken(token: string): Promise<{ msg: string }> {
      const res = await api.post('/auth/verify-forgot-password-token', { token })
      return res.data as { msg: string }
    },

    async resetPassword(req: ResetPasswordRequest): Promise<{ msg: string }> {
      const res = await api.post('/auth/reset-password', req)
      return res.data as { msg: string }
    },

    async fetchMe() {
      try {
        this.isLoading = true
        const res = await api.get('/auth/me')
        this._applyAuth(res.data)
      } catch {
        this.user = null
        this.currentTenant = null
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      } catch {
        // Sesi lokal tetap dibersihkan meski server tidak merespons.
      } finally {
        this.user = null
        this.currentTenant = null
        this.tenants = []
        this.tenantsLoaded = false
        // Biarkan `_initialized` tetap true agar guard tidak fetchMe lagi.
        _initialized = true
        navigate('/signin')
      }
    },

    // -----------------------------------------------------------------------
    // Tenant (workspace)
    // -----------------------------------------------------------------------

    /** Semua workspace yang bisa diakses user. `force` memaksa ambil ulang. */
    async fetchTenants(force = false) {
      if (this.tenantsLoaded && !force) return this.tenants

      this.tenantsLoading = true
      try {
        const res = await api.get('/tenants')
        this.tenants = res.data.tenants
        this.tenantsLoaded = true
        return this.tenants
      } finally {
        this.tenantsLoading = false
      }
    },

    /** Buat workspace baru (user jadi owner) lalu jadikan aktif. */
    async createTenant(req: CreateTenantRequest) {
      try {
        this.isLoading = true
        const res = await api.post('/tenants', req)
        this._applyTenantSwitch(res.data)
        return res.data as TenantAuthResponse
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Set tenant "terakhir dipakai" sebagai preferensi session.
     *
     * Tenant aktif sendiri ditentukan URL (`/t/{tenantPublicId}/...`); endpoint
     * ini hanya menyimpan preferensi untuk redirect setelah login.
     */
    async switchTenant(req: SwitchTenantRequest) {
      try {
        this.isLoading = true
        const res = await api.post(`/tenants/${req.tenantId}/switch`)
        this._applyTenantSwitch(res.data)
        return res.data as TenantAuthResponse
      } finally {
        this.isLoading = false
      }
    },

    // -----------------------------------------------------------------------
    // Verifikasi email
    // -----------------------------------------------------------------------

    /**
     * Verifikasi email dengan kode dari email user.
     *
     * Menimpa `user` dari respons agar banner langsung hilang — server sudah
     * membuang cache-nya, jadi tidak perlu `fetchMe()` tambahan.
     */
    async verifyEmail(token: string): Promise<VerifyEmailResponse> {
      const res = await api.post('/auth/verify-email', { token })
      const result = res.data as VerifyEmailResponse

      if (this.user && result.isVerified) {
        this.user = { ...this.user, isVerified: true, emailVerifiedAt: new Date().toISOString() }
      }

      return result
    },

    /** Kirim ulang kode verifikasi ke email akun yang sedang login. */
    async resendVerification(): Promise<ResendVerificationResponse> {
      const res = await api.post('/auth/resend-verification')
      return res.data as ResendVerificationResponse
    },

    /** Gabung workspace lewat kode undangan. */
    async joinByCode(req: JoinTenantRequest) {
      try {
        this.isLoading = true
        const res = await api.post('/auth/tenant/join', req)
        this._applyTenantSwitch(res.data)
        return res.data
      } finally {
        this.isLoading = false
      }
    },

    // -----------------------------------------------------------------------
    // Sessions (perangkat) — halaman Keamanan
    // -----------------------------------------------------------------------

    async fetchSessions(): Promise<SessionInfo[]> {
      const res = await api.get('/auth/sessions')
      return res.data.sessions
    },

    async revokeSession(sessionId: string) {
      const res = await api.delete(`/auth/sessions/${sessionId}`)
      // Sesi saat ini di-revoke -> paksa logout.
      if (res.data?.revokedCurrent) {
        this.user = null
        this.currentTenant = null
        navigate('/signin')
      }
      return res.data
    },

    async revokeOtherSessions() {
      const res = await api.post('/auth/sessions/revoke-others')
      return res.data
    },

    /** Redirect ke signin sambil menyimpan tujuan semula. */
    requireAuth(redirect: string) {
      navigateWithRedirect('/signin', redirect)
    },
  },
})
