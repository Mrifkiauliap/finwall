import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { z, ZodType } from "zod";

export function loadEnv() {
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

export const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z.string().default("info"),
});

export type BaseConfig = z.infer<typeof baseEnvSchema>;

export function createConfigLoader<TSchema extends ZodType>(schema: TSchema) {
  loadEnv();

  const parsed: z.infer<TSchema> = schema.parse(process.env);

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
