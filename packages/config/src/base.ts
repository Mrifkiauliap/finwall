import { z, ZodType } from "zod";

/**
 * Modul ini TIDAK boleh mengimpor API Node (`fs`, `path`, `dotenv`).
 *
 * Skema & loader di sini dipakai bersama oleh backend (`@finwall/config/api`)
 * dan frontend (`@finwall/config/web`); frontend di-bundle untuk browser,
 * sehingga pemuatan `.env` ditempatkan terpisah di `loadEnv.ts` (Node-only).
 */

export const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z.string().default("info"),
});

export type BaseConfig = z.infer<typeof baseEnvSchema>;

/**
 * Bangun loader bertipe dari sebuah schema.
 *
 * `source` wajib diberikan eksplisit (mis. `process.env` di Node atau
 * `import.meta.env` di Vite) supaya tidak ada akses implisit ke `process`
 * yang akan gagal di browser.
 */
export function createEnvLoader<TSchema extends ZodType>(
  schema: TSchema,
  source: Record<string, unknown>,
) {
  const parsed: z.infer<TSchema> = schema.parse(source);

  function getConfig(): z.infer<TSchema>;
  function getConfig<K extends keyof z.infer<TSchema>>(
    key: K,
  ): z.infer<TSchema>[K];
  function getConfig<K extends keyof z.infer<TSchema>>(key?: K) {
    if (key === undefined) return parsed;
    return parsed[key];
  }

  return getConfig;
}
