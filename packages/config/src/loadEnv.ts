import dotenv from "dotenv";
import fs from "fs";
import path from "path";

/**
 * Muat berkas `.env` dari direktori terdekat yang memilikinya.
 *
 * HANYA untuk runtime Node (API, tooling, `nuxt.config`). Modul ini sengaja
 * dipisah dari `base.ts` supaya `@finwall/config/web` tetap dapat di-bundle
 * untuk browser tanpa ikut menarik `fs`/`path`/`dotenv`.
 */
export function loadEnv(): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  let currentDir = process.cwd();

  while (true) {
    const envPath = path.join(currentDir, ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
}
