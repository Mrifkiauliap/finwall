import { cache, sessionStore } from '@finwall/cache';
import getConfig from '@finwall/config/api';
import { and, db, eq, isNull, sessions, users } from '@finwall/db';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

const config = getConfig();

import type { AuthenticatedUser, JwtPayload } from '@finwall/shared';
export type { AuthenticatedUser, JwtPayload };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          if (request && request.cookies) {
            return request.cookies['access_token'] || null;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    if (payload.tokenType === 'refresh') {
      throw new UnauthorizedException('Invalid access token');
    }

    const sessionId = payload.sessionId;
    if (!sessionId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Cek hot-path via mirror Valkey; fallback ke DB jika Valkey tidak ada.
    const activeInCache = await sessionStore.isActive(sessionId);
    if (!activeInCache) {
      const activeInDb = await this.isSessionActiveInDb(sessionId, payload.sub);
      if (!activeInDb) {
        throw new UnauthorizedException('Session has been revoked or expired');
      }
    }

    const user = await this.loadUser(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or account is inactive');
    }

    // Identitas saja: tenant aktif tidak diambil dari token, melainkan
    // di-resolve dari URL oleh TenantGuard.
    return {
      ...user,
      sessionId,
    };
  }

  private async isSessionActiveInDb(
    sessionId: string,
    userIdSub: string,
  ): Promise<boolean> {
    const userId = Number(userIdSub);
    if (!Number.isInteger(userId)) {
      return false;
    }

    const rows = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.publicId, sessionId),
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  private async loadUser(sub: string) {
    const userId = Number(sub);
    if (!Number.isInteger(userId)) {
      return null;
    }

    // Namespace terpisah dari user:profile:{publicId} karena membawa field
    // internal (id numeric, timestamp) yang dibutuhkan guard/handler.
    const cacheKey = `user:auth:${userId}`;
    const cached =
      await cache.get<Omit<AuthenticatedUser, 'sessionId'>>(cacheKey);

    if (cached) {
      if (!cached.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }
      return cached;
    }

    const [user] = await db
      .select({
        id: users.id,
        publicId: users.publicId,
        username: users.username,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        timezone: users.timezone,
        isActive: users.isActive,
        isVerified: users.isVerified,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      return null;
    }

    const safe = {
      id: user.id,
      publicId: user.publicId,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      timezone: user.timezone,
      isActive: user.isActive,
      isVerified: user.isVerified,
      emailVerifiedAt: user.emailVerifiedAt
        ? user.emailVerifiedAt.toISOString()
        : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    await cache.set(cacheKey, safe, 900);

    return safe;
  }
}
