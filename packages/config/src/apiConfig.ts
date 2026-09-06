import { z } from "zod";
import { baseEnvSchema, createConfigLoader } from "./base.js";

const port = () => z.coerce.number().int().min(1).max(65535);

const secret = (name: string, minLength = 32) =>
  z.string().min(minLength, `${name} must be at least ${minLength} characters`);

const jwtExpiresIn = () =>
  z.string().regex(/^\d+[smhd]$/, "must match pattern like '15m', '7d', '1h'");

const apiEnvSchema = baseEnvSchema
  .extend({
    APP_PORT: port().default(3000),
    APP_SECRET: secret("APP_SECRET"),

    JWT_ACCESS_SECRET: secret("JWT_ACCESS_SECRET"),
    JWT_ACCESS_EXPIRES_IN: jwtExpiresIn().default("15m"),
    JWT_REFRESH_SECRET: secret("JWT_REFRESH_SECRET"),
    JWT_REFRESH_EXPIRES_IN: jwtExpiresIn().default("7d"),

    ENCRYPTION_KEY: z
      .string()
      .length(
        44,
        "ENCRYPTION_KEY must be a base64-encoded 32-byte key (44 chars)",
      ),

    DATABASE_HOST: z.string().default("localhost"),
    DATABASE_PORT: port().default(5432),
    DATABASE_USER: z.string().default("postgres"),
    DATABASE_PASSWORD: z.string().default("postgres"),
    DATABASE_NAME: z.string().default("finwall"),

    VALKEY_HOST: z.string().default("localhost"),
    VALKEY_PORT: port().default(6379),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;

    const required = [
      "DATABASE_HOST",
      "DATABASE_USER",
      "DATABASE_PASSWORD",
      "DATABASE_NAME",
    ] as const;

    for (const key of required) {
      if (!env[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required in production`,
        });
      }
    }

    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_REFRESH_SECRET"],
        message: "JWT_REFRESH_SECRET must be different from JWT_ACCESS_SECRET",
      });
    }
  });

export type ApiConfig = z.infer<typeof apiEnvSchema>;

const getConfig = createConfigLoader(apiEnvSchema);

export default getConfig;
