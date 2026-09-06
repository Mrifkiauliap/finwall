// https://nuxt.com/docs/api/configuration/nuxt-config
import getConfig from "@finwall/config/web";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

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

  // Injeksi script ke <head> SEBELUM CSS diparse.
  // Membaca localStorage lalu menambah class 'dark' ke <html> secara sinkron
  // → tidak ada flash light→dark saat reload.
  app: {
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
    defaultLocale: "id",
    locales: [
      { code: "id", name: "Bahasa Indonesia" },
      { code: "en", name: "English" },
    ],
    strategy: "no_prefix",
    detectBrowserLanguage: false, // Biarkan store yang mengontrol
  },
});
