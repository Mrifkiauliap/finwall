import { createApi } from "@/services/api";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const api = createApi(config.public.apiBaseUrl || "http://localhost:3001");

  return {
    provide: {
      api,
    },
  };
});
