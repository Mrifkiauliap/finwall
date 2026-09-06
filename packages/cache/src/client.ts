import getConfig from "@finwall/config/api";
import { createLogger } from "@finwall/logger";
import { Redis } from "ioredis";

const config = getConfig();
const logger = createLogger("cache");

let sharedValkey: Redis | null = null;

/**
 * Create a new Valkey connection.
 */
export function createCacheConnection(): Redis {
  const connection = new Redis({
    host: config.VALKEY_HOST,
    port: config.VALKEY_PORT,

    // Let ioredis retry connections automatically.
    maxRetriesPerRequest: null,
  });

  connection.on("connect", () => {
    logger.info("Valkey cache connected");
  });

  connection.on("error", (err) => {
    logger.error({ err }, "Valkey cache error");
  });

  connection.on("close", () => {
    logger.info("Valkey cache connection closed");
  });

  return connection;
}

/**
 * Get the shared cache connection.
 */
export function getCacheClient(): Redis {
  if (!sharedValkey) {
    sharedValkey = createCacheConnection();
  }

  return sharedValkey;
}

/**
 * Gracefully close the cache connection.
 */
export async function closeCache(): Promise<void> {
  if (!sharedValkey) {
    return;
  }

  await sharedValkey.quit();
  sharedValkey = null;

  logger.info("Valkey cache connection closed");
}
