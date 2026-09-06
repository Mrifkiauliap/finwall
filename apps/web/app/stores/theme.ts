import { defineStore } from "pinia";

export type Theme = "light" | "dark" | "system";

// Disimpan di luar store agar tidak di-serialize ke SSR payload
let _applied = false;

export const useThemeStore = defineStore("theme", {
  state: () => ({
    theme: "system" as Theme,
  }),

  getters: {
    /** Theme yang benar-benar aktif (resolving 'system' → actual) */
    resolvedTheme(): "light" | "dark" {
      if (this.theme !== "system") return this.theme;
      if (import.meta.server) return "light";
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    },

    isDark(): boolean {
      return this.resolvedTheme === "dark";
    },
  },

  actions: {
    /** Panggil saat app boot untuk membaca localStorage dan apply class. */
    init() {
      if (import.meta.server) return;
      if (_applied) return;
      _applied = true;

      const saved = localStorage.getItem("finwall:theme") as Theme | null;
      this.theme = saved ?? "system";
      this._applyClass();

      // Dengarkan perubahan system preference (khusus mode 'system')
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => {
          if (this.theme === "system") this._applyClass();
        });
    },

    setTheme(theme: Theme) {
      this.theme = theme;
      localStorage.setItem("finwall:theme", theme);
      this._applyClass();
    },

    toggle() {
      this.setTheme(this.isDark ? "light" : "dark");
    },

    _applyClass() {
      const isDark = this.resolvedTheme === "dark";
      document.documentElement.classList.toggle("dark", isDark);
    },
  },
});
