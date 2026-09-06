import { getCacheClient } from "./client.js";

// Mirror session aktif di Valkey utk hot-path check per-request.
// Source of truth tetap tabel `sessions` di Postgres.
// Key: `session:{sessionPublicId}` dengan TTL == umur session (refresh window),
// jadi key basi otomatis kedaluwarsa walau tidak di-revoke eksplisit.

const sessionKey = (sessionId: string) => `session:${sessionId}`;

export interface ActiveSessionMeta {
  sessionId: string;
  userId: number;
  expiresAt: string; // ISO
}

export const sessionStore = {
  async saveActive(
    sessionId: string,
    meta: ActiveSessionMeta,
    ttlSeconds: number,
  ): Promise<void> {
    await getCacheClient().set(
      sessionKey(sessionId),
      JSON.stringify(meta),
      "EX",
      ttlSeconds,
    );
  },

  async isActive(sessionId: string): Promise<boolean> {
    return (await getCacheClient().exists(sessionKey(sessionId))) === 1;
  },

  async touch(sessionId: string, ttlSeconds: number): Promise<void> {
    await getCacheClient().expire(sessionKey(sessionId), ttlSeconds);
  },

  async remove(sessionId: string): Promise<void> {
    await getCacheClient().del(sessionKey(sessionId));
  },
};
