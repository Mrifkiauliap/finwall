import { z } from "zod";
import { baseEnvSchema, createEnvLoader } from "./base.js";

/**
 * Konfigurasi untuk aplikasi web (Vite/Nuxt).
 *
 * Modul ini AMAN untuk browser: tidak ada `import.meta.env`/`process` yang
 * diakses saat impor. Pemanggil menyerahkan sumber env-nya sendiri lewat
 * `parseWebEnv()` (SPA: `import.meta.env`) atau memakai default export
 * `getConfig()` yang membaca `process.env` (Node: `nuxt.config.ts`).
 */

export const webEnvSchema = baseEnvSchema.extend({
  // `/` bukan URL absolut, jadi cukup string biasa (dipakai sebagai base path).
  VITE_BASE_URL: z.string().default("/"),
  VITE_API_BASE_URL: z
    .string()
    .url("VITE_API_BASE_URL must be a valid URL")
    .default("http://localhost:3001"),
});

export type WebConfig = z.infer<typeof webEnvSchema>;

/**
 * Validasi nilai env yang sudah tersedia di sisi pemanggil.
 *
 * Dipakai SPA: `parseWebEnv(import.meta.env)` — Vite menyuntikkan seluruh
 * variabel `VITE_*` ke sana saat build.
 */
export function parseWebEnv(source: Record<string, unknown>): WebConfig {
  return webEnvSchema.parse(source);
}

/** Loader bertipe dengan pola `getConfig()` / `getConfig('KEY')`. */
export function createWebConfig(source: Record<string, unknown>) {
  return createEnvLoader(webEnvSchema, source);
}

/**
 * Loader Node untuk `nuxt.config.ts` / tooling.
 *
 * `process.env` dibaca di dalam fungsi (bukan saat impor) agar bundel browser
 * yang memuat modul ini tidak langsung gagal.
 */
function getConfig(): WebConfig;
function getConfig<K extends keyof WebConfig>(key: K): WebConfig[K];
function getConfig<K extends keyof WebConfig>(key?: K) {
  const source =
    typeof process !== "undefined" && process.env
      ? (process.env as Record<string, unknown>)
      : {};

  const parsed = webEnvSchema.parse(source);
  return key === undefined ? parsed : parsed[key];
}

export default getConfig;
