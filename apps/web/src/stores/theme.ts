import { defineStore } from 'pinia'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'finwall:theme'

/** Listener system preference hanya dipasang sekali per aplikasi. */
let _listenerAttached = false

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'system' as Theme,
  }),

  getters: {
    /** Theme yang benar-benar aktif (resolving 'system' -> aktual). */
    resolvedTheme(): 'light' | 'dark' {
      if (this.theme !== 'system') return this.theme
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    },

    isDark(): boolean {
      return this.resolvedTheme === 'dark'
    },
  },

  actions: {
    /** Panggil saat boot: baca localStorage dan terapkan class pada <html>. */
    init() {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
      this.theme = saved ?? 'system'
      this._applyClass()

      if (_listenerAttached) return
      _listenerAttached = true

      // Dengarkan perubahan preferensi sistem (relevan saat mode 'system').
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.theme === 'system') this._applyClass()
      })
    },

    setTheme(theme: Theme) {
      this.theme = theme
      localStorage.setItem(STORAGE_KEY, theme)
      this._applyClass()
    },

    toggle() {
      this.setTheme(this.isDark ? 'light' : 'dark')
    },

    _applyClass() {
      document.documentElement.classList.toggle('dark', this.resolvedTheme === 'dark')
    },
  },
})
