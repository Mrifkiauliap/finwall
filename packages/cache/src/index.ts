import { closeCache, getCacheClient } from "./client";

const cache = {
  get: async <T>(key: string): Promise<T | null> => {
    const value = await getCacheClient().get(key);

    return value === null ? null : (JSON.parse(value) as T);
  },

  set: async <T>(key: string, value: T, ttl?: number): Promise<void> => {
    const serialized = JSON.stringify(value);

    if (ttl !== undefined) {
      await getCacheClient().set(key, serialized, "EX", ttl);
    } else {
      await getCacheClient().set(key, serialized);
    }
  },

  del: async (key: string): Promise<void> => {
    await getCacheClient().del(key);
  },

  exists: async (key: string): Promise<boolean> => {
    return (await getCacheClient().exists(key)) === 1;
  },

  expire: async (key: string, ttl: number): Promise<void> => {
    await getCacheClient().expire(key, ttl);
  },

  ttl: async (key: string): Promise<number> => {
    return getCacheClient().ttl(key);
  },
};

export * from "./session-store";
export { cache, closeCache, getCacheClient };
