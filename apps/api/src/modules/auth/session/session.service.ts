import { cache, sessionStore } from '@finwall/cache';
import getConfig from '@finwall/config/api';
import {
  and,
  db,
  desc,
  eq,
  isNull,
  sessions,
  tenants,
  tenantUsers,
} from '@finwall/db';
import {
  type AuthTokens,
  type CurrentTenant,
  type JwtPayload,
  type SessionMeta,
  sessionMetaSchema,
} from '@finwall/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { sha256 } from '../../../core/utils/crypto.js';

const config = getConfig();

// Refresh window (7d) — sinkron dengan JWT_REFRESH_EXPIRES_IN. TTL Valkey mirror
// memakai angka ini sehingga key basi kedaluwarsa otomatis.
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

const ACCESS_EXPIRES_IN =
  ((config as any).JWT_ACCESS_EXPIRES_IN as string) || '15m';
const REFRESH_EXPIRES_IN =
  ((config as any).JWT_REFRESH_EXPIRES_IN as string) || '7d';

export const NULL_TENANT: CurrentTenant = {
  publicId: null,
  name: null,
  role: null,
};

/**
 * Primitif session/token yang dipakai AuthService, TenantService, dan
 * InviteService: menandatangani JWT, membuat session di Postgres + mirror
 * Valkey, merotasi refresh token di tempat, me-revoke session, dan menyelesaikan
 * tenant aktif (terakhir dipakai / by publicId utk member).
 */
@Injectable()
export class SessionService {
  constructor(private readonly jwtService: JwtService) {}

  private async signAccessToken(
    userId: number,
    sessionId: string,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: String(userId),
      sessionId,
      tokenType: 'access',
    };
    return this.jwtService.signAsync(payload, {
      secret: config.JWT_ACCESS_SECRET,
      expiresIn: ACCESS_EXPIRES_IN as any,
    });
  }

  private async signRefreshToken(
    userId: number,
    sessionId: string,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: String(userId),
      sessionId,
      tokenType: 'refresh',
    };
    return this.jwtService.signAsync(payload, {
      secret: config.JWT_REFRESH_SECRET,
      expiresIn: REFRESH_EXPIRES_IN as any,
    });
  }

  /** Menandatangani access + refresh token (identitas saja, tanpa tenant). */
  async issueTokens(userId: number, sessionId: string): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(userId, sessionId),
      this.signRefreshToken(userId, sessionId),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_EXPIRES_IN,
    };
  }

  /** Membuat session baru (signup/signin) dan menerbitkan tokennya. */
  async createSession(
    userId: number,
    tenantId: string | null,
    meta?: SessionMeta,
  ): Promise<{ sessionId: string; tokens: AuthTokens }> {
    const m = sessionMetaSchema.parse(meta ?? {});
    const now = new Date();
    const expiresAt = new Date(now.getTime() + REFRESH_TTL_SECONDS * 1000);
    const sessionId = randomUUID();

    const tokens = await this.issueTokens(userId, sessionId);
    const refreshTokenHash = sha256(tokens.refreshToken);

    await db.insert(sessions).values({
      publicId: sessionId,
      userId,
      tenantId,
      refreshTokenHash,
      userAgent: m.userAgent,
      ipAddress: m.ipAddress,
      device: m.device,
      lastActiveAt: now,
      expiresAt,
    });

    await sessionStore.saveActive(
      sessionId,
      { sessionId, userId, expiresAt: expiresAt.toISOString() },
      REFRESH_TTL_SECONDS,
    );

    return { sessionId, tokens };
  }

  /**
   * Merotasi refresh token pada session yang sama (refresh / tenant berganti).
   * Update di tempat: ganti refreshTokenHash + metadata + reset revokedAt
   * sehingga session lama tidak meninggalkan sisa soft-revoke.
   */
  async rotateSession(
    sessionPublicId: string,
    tenantId: string | null,
    meta?: SessionMeta,
  ): Promise<AuthTokens> {
    const m = sessionMetaSchema.parse(meta ?? {});
    const [session] = await db
      .select({ userId: sessions.userId })
      .from(sessions)
      .where(eq(sessions.publicId, sessionPublicId))
      .limit(1);

    if (!session) {
      throw new UnauthorizedException('Session tidak ditemukan');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + REFRESH_TTL_SECONDS * 1000);
    const tokens = await this.issueTokens(session.userId, sessionPublicId);
    const refreshTokenHash = sha256(tokens.refreshToken);

    await db
      .update(sessions)
      .set({
        refreshTokenHash,
        tenantId,
        userAgent: m.userAgent ?? undefined,
        ipAddress: m.ipAddress ?? undefined,
        device: m.device ?? undefined,
        lastActiveAt: now,
        expiresAt,
        revokedAt: null,
      })
      .where(eq(sessions.publicId, sessionPublicId));

    await sessionStore.saveActive(
      sessionPublicId,
      {
        sessionId: sessionPublicId,
        userId: session.userId,
        expiresAt: expiresAt.toISOString(),
      },
      REFRESH_TTL_SECONDS,
    );

    return tokens;
  }

  /** Merotasi session paling baru milik user (create/switch/join tenant). */
  async rotateLatestSessionForUser(
    userId: number,
    tenantId: string | null,
    meta?: SessionMeta,
  ): Promise<AuthTokens> {
    const [session] = await db
      .select({ publicId: sessions.publicId })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
      .orderBy(desc(sessions.lastActiveAt))
      .limit(1);

    if (!session) {
      const { tokens } = await this.createSession(userId, tenantId, meta);
      return tokens;
    }

    return this.rotateSession(session.publicId, tenantId, meta);
  }

  /** Revoke session (soft) + hapus mirror Valkey. True bila ditemukan. */
  async revokeSessionByPublicId(
    userId: number,
    sessionId: string,
  ): Promise<boolean> {
    const [row] = await db
      .select({ id: sessions.id, publicId: sessions.publicId })
      .from(sessions)
      .where(and(eq(sessions.publicId, sessionId), eq(sessions.userId, userId)))
      .limit(1);

    if (!row) {
      return false;
    }

    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, row.id));
    await sessionStore.remove(row.publicId);
    return true;
  }

  /** Revoke semua session milik user (logout semua device / deteksi reuse). */
  async revokeAllUserSessions(userId: number): Promise<void> {
    const rows = await db
      .select({ id: sessions.id, publicId: sessions.publicId })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));

    if (rows.length === 0) return;

    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));

    for (const row of rows) {
      await sessionStore.remove(row.publicId);
    }
  }

  /** Hapus mirror Valkey session (dipakai revoke massal). */
  async deleteActiveSession(sessionId: string): Promise<void> {
    await sessionStore.remove(sessionId);
  }

  // ---------------------------------------------------------------------------
  // Tenant helpers (dipakai auth & tenant service)
  // ---------------------------------------------------------------------------

  /**
   * Preferensi tenant "terakhir dipakai" pada satu session.
   *
   * Ini BUKAN otorisasi — tenant aktif ditentukan URL dan diverifikasi
   * keanggotaannya lewat `getTenantByPublicIdForUser`. Nilai ini hanya dipakai
   * untuk keperluan UX (redirect setelah login).
   */
  async getTenantPreferenceForSession(
    sessionId: string,
  ): Promise<string | null> {
    const [row] = await db
      .select({ tenantId: sessions.tenantId })
      .from(sessions)
      .where(eq(sessions.publicId, sessionId))
      .limit(1);

    return row?.tenantId ?? null;
  }

  /** Tenant terakhir dipakai user (dari session terbaru yg masih valid). */
  async getLastUsedTenant(userId: number): Promise<CurrentTenant | null> {
    const [last] = await db
      .select({
        publicId: tenants.publicId,
        name: tenants.name,
        role: tenantUsers.role,
      })
      .from(sessions)
      .innerJoin(tenants, eq(sessions.tenantId, tenants.publicId))
      .innerJoin(
        tenantUsers,
        and(
          eq(sessions.userId, tenantUsers.userId),
          eq(tenants.id, tenantUsers.tenantId),
        ),
      )
      .where(
        and(
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
          isNull(tenants.deletedAt),
        ),
      )
      .orderBy(desc(sessions.lastActiveAt))
      .limit(1);

    if (last) {
      return { publicId: last.publicId, name: last.name, role: last.role };
    }

    const [first] = await db
      .select({
        publicId: tenants.publicId,
        name: tenants.name,
        role: tenantUsers.role,
      })
      .from(tenantUsers)
      .innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
      .where(and(eq(tenantUsers.userId, userId), isNull(tenants.deletedAt)))
      .orderBy(tenantUsers.createdAt)
      .limit(1);

    return first
      ? { publicId: first.publicId, name: first.name, role: first.role }
      : null;
  }

  /** Cari tenant by publicId; hanya bila user adalah member-nya. */
  async getTenantByPublicIdForUser(
    userId: number,
    tenantPublicId: string,
  ): Promise<CurrentTenant | null> {
    const [row] = await db
      .select({
        publicId: tenants.publicId,
        name: tenants.name,
        role: tenantUsers.role,
      })
      .from(tenantUsers)
      .innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
      .where(
        and(
          eq(tenantUsers.userId, userId),
          eq(tenants.publicId, tenantPublicId),
          isNull(tenants.deletedAt),
        ),
      )
      .limit(1);

    return row
      ? { publicId: row.publicId, name: row.name, role: row.role }
      : null;
  }

  /** Cache profil user internal (id + timestamp) utk hot-path guard. */
  async cacheAuthenticatedUser(
    userId: number,
    user: Record<string, unknown>,
  ): Promise<void> {
    await cache.set(`user:auth:${userId}`, user, 900);
  }

  async delAuthenticatedUser(userId: number): Promise<void> {
    await cache.del(`user:auth:${userId}`);
  }

  /**
   * Bersihkan cache terkait user setelah tenant aktif berubah
   * (switch/create/join) supaya request berikutnya memuat data tenant &
   * profil terbaru, bukan data workspace lama.
   */
  async invalidateUserCaches(
    userId: number,
    publicId?: string | null,
  ): Promise<void> {
    await Promise.all([
      cache.del(`tenant:list:${userId}`),
      cache.del(`tenant:member:${userId}`),
      cache.del(`user:auth:${userId}`),
      publicId ? cache.del(`user:profile:${publicId}`) : Promise.resolve(),
    ]);
  }
}
