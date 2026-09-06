import { cache } from '@finwall/cache';
import getConfig from '@finwall/config/api';
import {
  and,
  db,
  desc,
  eq,
  gt,
  isNull,
  ne,
  or,
  sessions,
  users,
} from '@finwall/db';
import {
  type AuthResponse,
  type CurrentTenant,
  type JwtPayload,
  type MeResponse,
  type SessionInfo,
  type SessionListResponse,
  type SigninRequest,
  type SignupRequest,
  signinRequestSchema,
  signupRequestSchema,
} from '@finwall/shared';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { sha256 } from '../../core/utils/crypto.js';
import { NULL_TENANT, SessionService } from './session/session.service.js';

const config = getConfig();

/** Bentuk user aman tanpa secret/hash. */
export interface SafeUser {
  publicId: string;
  username: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  timezone: string;
  isActive: boolean;
}

/** Konversi row users -> SafeUser. */
export function toSafeUser(user: {
  publicId: string;
  username: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  timezone: string;
  isActive: boolean;
}): SafeUser {
  return {
    publicId: user.publicId,
    username: user.username,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    isActive: user.isActive,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  // ---------------------------------------------------------------------------
  // Signup / Signin
  // ---------------------------------------------------------------------------

  /** Signup akun baru + buat session. User mulai TANPA tenant. */
  async signup(
    dto: SignupRequest,
    meta?: {
      userAgent: string | null;
      ipAddress: string | null;
      device: string | null;
    },
  ): Promise<AuthResponse> {
    const data = signupRequestSchema.parse(dto);
    const email = data.email.toLowerCase().trim();
    const username = data.username.trim();
    const phone = data.phone?.trim() || null;

    const existing = await db
      .select({ id: users.id, email: users.email, username: users.username })
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          or(
            eq(users.email, email),
            eq(users.username, username),
            ...(phone ? [eq(users.phone, phone)] : []),
          ),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      const match = existing[0];
      if (match.email === email) {
        throw new BadRequestException('Email sudah digunakan');
      }
      if (match.username === username) {
        throw new BadRequestException('Username sudah digunakan');
      }
      throw new BadRequestException('Nomor telepon sudah digunakan');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const timezone = data.timezone || 'Asia/Jakarta';

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        phone,
        passwordHash: hashedPassword,
        timezone,
        isActive: true,
      })
      .returning();

    const safeUser = toSafeUser(newUser);

    await cache.set(`user:profile:${safeUser.publicId}`, safeUser, 900);

    const { tokens } = await this.sessionService.createSession(
      newUser.id,
      null,
      meta,
    );

    return {
      user: safeUser,
      tenant: NULL_TENANT,
      tokens,
    };
  }

  /** Signin: tenant aktif = tenant terakhir dipakai; null jika belum ada. */
  async signin(
    dto: SigninRequest,
    meta?: {
      userAgent: string | null;
      ipAddress: string | null;
      device: string | null;
    },
  ): Promise<AuthResponse> {
    const data = signinRequestSchema.parse(dto);
    const identifier = data.identifier.trim().toLowerCase();

    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          or(eq(users.email, identifier), eq(users.username, data.identifier)),
        ),
      )
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Email / Username tidak terdaftar');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Akun tidak aktif. Hubungi admin');
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password salah');
    }

    const safeUser = toSafeUser(user);

    const lastTenant = await this.sessionService.getLastUsedTenant(user.id);
    const tenant: CurrentTenant = lastTenant ?? NULL_TENANT;

    await cache.set(`user:profile:${safeUser.publicId}`, safeUser, 900);

    const { tokens } = await this.sessionService.createSession(
      user.id,
      tenant.publicId,
      meta,
    );

    return {
      user: safeUser,
      tenant,
      tokens,
    };
  }

  // ---------------------------------------------------------------------------
  // Me / sessions
  // ---------------------------------------------------------------------------

  /** Profil user + tenant aktif utk session ini. */
  async getMe(userId: number, tenantId: string | null): Promise<MeResponse> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const tenant = tenantId
      ? await this.sessionService.getTenantByPublicIdForUser(userId, tenantId)
      : null;

    return {
      user: toSafeUser(user),
      tenant: tenant ?? NULL_TENANT,
    };
  }

  /** Daftar session aktif milik user. */
  async listSessions(
    userId: number,
    currentSessionId: string,
  ): Promise<SessionListResponse> {
    const rows = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(sessions.lastActiveAt));

    const list: SessionInfo[] = rows.map((s) => ({
      id: s.publicId,
      device: s.device,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      lastActiveAt: s.lastActiveAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      isCurrent: s.publicId === currentSessionId,
    }));

    return { sessions: list };
  }

  /** Revoke satu session milik user. */
  async revokeSession(
    userId: number,
    sessionId: string,
    currentSessionId: string,
  ): Promise<{ revokedCurrent: boolean; message: string }> {
    const found = await this.sessionService.revokeSessionByPublicId(
      userId,
      sessionId,
    );
    if (!found) {
      throw new NotFoundException('Session tidak ditemukan');
    }

    return {
      revokedCurrent: sessionId === currentSessionId,
      message: 'Session revoked',
    };
  }

  /** Revoke semua session kecuali session saat ini. */
  async revokeOtherSessions(
    userId: number,
    currentSessionId: string,
  ): Promise<{ revoked: number }> {
    const rows = await db
      .select({ id: sessions.id, publicId: sessions.publicId })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          ne(sessions.publicId, currentSessionId),
          isNull(sessions.revokedAt),
        ),
      );

    if (rows.length === 0) {
      return { revoked: 0 };
    }

    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(sessions.userId, userId),
          ne(sessions.publicId, currentSessionId),
          isNull(sessions.revokedAt),
        ),
      );

    for (const row of rows) {
      await this.sessionService.deleteActiveSession(row.publicId);
    }

    return { revoked: rows.length };
  }

  // ---------------------------------------------------------------------------
  // Refresh / Logout
  // ---------------------------------------------------------------------------

  /**
   * Refresh token dengan rotasi + deteksi reuse: token lama di-revoke dan token
   * refresh baru (sessionId sama) diterbitkan. Jika hash tidak cocok dengan row
   * aktif apapun (reuse setelah rotasi), seluruh session user dianggap bocor.
   */
  async refreshToken(refreshTokenString: string): Promise<AuthResponse> {
    if (!refreshTokenString) {
      throw new BadRequestException('Refresh Token dibutuhkan');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshTokenString,
        { secret: config.JWT_REFRESH_SECRET },
      );
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid / kadaluarsa');
    }

    if (!payload?.sub || payload.tokenType === 'access') {
      throw new UnauthorizedException('Refresh token tidak valid');
    }

    const userId = Number(payload.sub);
    const refreshHash = sha256(refreshTokenString);

    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessions.refreshTokenHash, refreshHash),
          isNull(sessions.revokedAt),
        ),
      )
      .limit(1);

    if (!session) {
      await this.sessionService.revokeAllUserSessions(userId);
      throw new UnauthorizedException('Sesi tidak valid, silahkan login ulang');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token sudah kedaluwarsa');
    }

    const user = await this.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    const tokens = await this.sessionService.rotateSession(
      session.publicId,
      session.tenantId,
      {
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        device: session.device,
      },
    );

    const tenant = session.tenantId
      ? await this.sessionService.getTenantByPublicIdForUser(
          userId,
          session.tenantId,
        )
      : null;

    return {
      user: toSafeUser(user),
      tenant: tenant ?? NULL_TENANT,
      tokens,
    };
  }

  /** Logout hanya utk device/session saat ini. */
  async logout(
    userId: number,
    sessionId: string,
  ): Promise<{ message: string }> {
    await this.sessionService.revokeSessionByPublicId(userId, sessionId);
    return { message: 'Logged out successfully' };
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private async getUserById(userId: number) {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  }
}
