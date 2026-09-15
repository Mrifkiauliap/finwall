// https://nuxt.com/docs/api/configuration/nuxt-config
import getConfig from "@finwall/config/web";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "app"),
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: getConfig().VITE_API_BASE_URL,
    },
  },

  css: ["~/assets/css/main.css"],
  modules: ["@pinia/nuxt", "shadcn-nuxt", "@nuxtjs/i18n"],

  app: {
    // Transisi antar halaman & antar layout (kelasnya di `assets/css/main.css`).
    pageTransition: { name: "page", mode: "out-in" },
    layoutTransition: { name: "layout", mode: "out-in" },
    head: {
      script: [
        {
          innerHTML: `
            (function(){
              try{
                var t=localStorage.getItem('finwall:theme');
                var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
                var isDark=(t==='dark')||(t!=='light'&&prefersDark);
                if(isDark) document.documentElement.classList.add('dark');
              }catch(e){}
            })();
          `.trim(),
          type: "text/javascript",
        },
      ],
    },
  },

  i18n: {
    langDir: "locales/",
    defaultLocale: "id",
    strategy: "no_prefix",
    locales: [
      {
        code: "id",
        name: "Bahasa Indonesia",
        iso: "id-ID",
        files: ["id/common.ts", "id/auth.ts", "id/validation.ts", "id/page.ts"],
      },
      {
        code: "en",
        name: "English",
        iso: "en-US",
        files: ["en/common.ts", "en/auth.ts", "en/validation.ts", "en/page.ts"],
      },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "finwall:locale",
      redirectOn: "root",
    },
  },
});
