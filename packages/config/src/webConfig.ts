import { z } from "zod";
import { baseEnvSchema, createConfigLoader } from "./base.js";

const webEnvSchema = baseEnvSchema.extend({
  VITE_API_BASE_URL: z.string().url().default("http://localhost:3001"),
});

export type WebConfig = z.infer<typeof webEnvSchema>;

const getConfig = createConfigLoader(webEnvSchema);

export default getConfig;
