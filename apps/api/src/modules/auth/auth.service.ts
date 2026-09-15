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
  userEmailVerifications,
  userPasswordResets,
  users,
} from '@finwall/db';
import {
  type AuthResponse,
  type CurrentTenant,
  ForgotPasswordRequest,
  type JwtPayload,
  type MeResponse,
  type ResendVerificationResponse,
  ResetPasswordRequest,
  type SessionInfo,
  type SessionListResponse,
  type SigninRequest,
  type SignupRequest,
  type VerifyEmailRequest,
  type VerifyEmailResponse,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
  signinRequestSchema,
  signupRequestSchema,
  verifyEmailRequestSchema,
} from '@finwall/shared';
import {
  hashPassword,
  passwordNeedsRehash,
  verifyPassword,
} from '@finwall/shared/password';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import dayjs from 'dayjs';
import {
  generateForgotPasswordToken,
  generateVerifyEmailToken,
  sha256,
} from '../../core/utils/crypto.js';
import { EmailService } from '../email/email.service.js';
import { NULL_TENANT, SessionService } from './session/session.service.js';

const config = getConfig();

/** Masa berlaku kode verifikasi email. Tetap sinkron dengan template email. */
const EMAIL_VERIFICATION_TTL_MINUTES = 30;

/** Masa berlaku kode reset password. Tetap sinkron dengan template email. */
const FORGOT_PASSWORD_TTL_MINUTES = 15;

/** Jeda minimum antar-permintaan kode baru (verifikasi email & reset password). */
const RESEND_COOLDOWN_SECONDS = 60;

/** Bentuk user aman tanpa secret/hash. */
export interface SafeUser {
  publicId: string;
  username: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  timezone: string;
  isActive: boolean;
  isVerified: boolean;
  emailVerifiedAt: string | null;
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
  isVerified: boolean;
  emailVerifiedAt: Date | null;
}): SafeUser {
  return {
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
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
  ) {}

  // ---------------------------------------------------------------------------
  // Signup / Signin / Forgot Password / Reset Password
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

    const hashedPassword = await hashPassword(data.password);
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
        isVerified: false,
      })
      .returning();

    const safeUser = toSafeUser(newUser);

    await cache.set(`user:profile:${safeUser.publicId}`, safeUser, 900);

    const { tokens } = await this.sessionService.createSession(
      newUser.id,
      null,
      meta,
    );

    await this.sendVerificationEmail(newUser.id, newUser.email, username);

    return {
      user: safeUser,
      tenant: NULL_TENANT,
      tokens,
    };
  }

  // ---------------------------------------------------------------------------
  // Verifikasi email
  // ---------------------------------------------------------------------------

  /**
   * Buat kode verifikasi baru (mengganti kode lama yang belum terpakai) lalu
   * kirim ke email user.
   *
   * Kode disimpan sebagai hash SHA-256 — sama seperti token reset password —
   * sehingga bocornya isi tabel tidak langsung memberi kode yang bisa dipakai.
   */
  private async sendVerificationEmail(
    userId: number,
    email: string,
    username: string,
  ): Promise<void> {
    const token = generateVerifyEmailToken();
    const tokenHash = sha256(token);

    await db
      .delete(userEmailVerifications)
      .where(eq(userEmailVerifications.userId, userId));

    await db.insert(userEmailVerifications).values({
      userId,
      tokenHash,
      expiresAt: dayjs().add(EMAIL_VERIFICATION_TTL_MINUTES, 'minute').toDate(),
    });

    try {
      await this.emailService.sendVerifyEmail(email, token, username);
    } catch (err) {
      // Best-effort: akun sudah terbuat, user dapat meminta kode baru.
      this.logger.warn(
        `Gagal mengirim kode verifikasi ke ${email}: ${String(err)}`,
      );
    }
  }

  /**
   * Verifikasi email dengan kode dari email user.
   *
   * Kode yang sudah terpakai dihapus, dan `isVerified` + `emailVerifiedAt`
   * di-update sekaligus agar tidak ada state setengah jalan.
   */
  async verifyEmail(
    userId: number,
    dto: VerifyEmailRequest,
  ): Promise<VerifyEmailResponse> {
    const data = verifyEmailRequestSchema.parse(dto);
    const tokenHash = sha256(data.token.trim());

    const [record] = await db
      .select()
      .from(userEmailVerifications)
      .where(
        and(
          eq(userEmailVerifications.tokenHash, tokenHash),
          isNull(userEmailVerifications.usedAt),
          gt(userEmailVerifications.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!record || record.userId !== userId) {
      throw new BadRequestException(
        'Kode verifikasi tidak valid atau sudah kadaluarsa',
      );
    }

    const verifiedAt = new Date();

    await db
      .update(users)
      .set({ isVerified: true, emailVerifiedAt: verifiedAt })
      .where(eq(users.id, userId));

    // Ditandai terpakai (bukan dihapus) agar ada jejak audit dan kode yang sama
    // otomatis ditolak bila dicoba lagi. Konsisten dengan alur reset password.
    await db
      .update(userEmailVerifications)
      .set({ usedAt: verifiedAt })
      .where(eq(userEmailVerifications.id, record.id));

    // WAJIB: `isVerified` ikut di-cache (profil + auth) sampai 15 menit.
    // Tanpa invalidasi, banner "email belum diverifikasi" masih tampil meski
    // DB sudah `is_verified = true`.
    await this.invalidateUserCaches(userId);

    return {
      message: 'Email berhasil diverifikasi',
      isVerified: true,
    };
  }

  /**
   * Kirim ulang kode verifikasi ke email pada sesi aktif.
   *
   * Email target diambil dari DATABASE (bukan dari body request) supaya endpoint
   * ini tidak bisa dipakai untuk membanjiri inbox orang lain.
   */
  async resendVerification(
    userId: number,
  ): Promise<ResendVerificationResponse> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email sudah diverifikasi');
    }

    // Cooldown via cache: semantik TTL, self-cleaning, tanpa baris DB tambahan.
    const cooldownKey = `verify-email:cooldown:${userId}`;
    if (await cache.get(cooldownKey)) {
      throw new BadRequestException(
        `Mohon tunggu ${RESEND_COOLDOWN_SECONDS} detik sebelum meminta kode baru`,
      );
    }

    // Sengaja TIDAK memakai `sendVerificationEmail` yang menelan error:
    // di sini pengguna sedang menunggu, jadi kegagalan harus terlihat.
    const token = generateVerifyEmailToken();
    const tokenHash = sha256(token);

    // Hanya SATU kode aktif per user: meminta kode baru membatalkan kode lama
    // agar kode yang masih beredar di inbox tidak bisa dipakai lagi.
    await db
      .delete(userEmailVerifications)
      .where(eq(userEmailVerifications.userId, userId));

    await db.insert(userEmailVerifications).values({
      userId,
      tokenHash,
      expiresAt: dayjs().add(EMAIL_VERIFICATION_TTL_MINUTES, 'minute').toDate(),
    });

    await this.emailService.sendVerifyEmail(user.email, token, user.username);

    // Cooldown dipasang SETELAH email terkirim: bila SMTP gagal (error di atas),
    // user tidak terjebak menunggu 60 detik tanpa pernah menerima kode apa pun.
    await cache.set(cooldownKey, 1, RESEND_COOLDOWN_SECONDS);

    return {
      message: 'Kode verifikasi baru telah dikirim',
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Buang cache user setelah datanya berubah (mis. status verifikasi).
   *
   * Ada DUA namespace yang menyimpan `isVerified`:
   * - `user:auth:{id}`    — dibaca `JwtStrategy` tiap request.
   * - `user:profile:{pid}` — profil ringkas pada respons API.
   * Keduanya harus dibuang, kalau tidak klien masih melihat status lama.
   */
  private async invalidateUserCaches(userId: number): Promise<void> {
    const [row] = await db
      .select({ publicId: users.publicId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await cache.del(`user:auth:${userId}`);

    if (row?.publicId) {
      await cache.del(`user:profile:${row.publicId}`);
    }
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
      throw new UnauthorizedException(
        'Kredensial kamu tidak valid atau password salah',
      );
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Akun tidak aktif. Hubungi admin');
    }

    const isPasswordValid = await verifyPassword(
      data.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Kredensial kamu tidak valid atau password salah',
      );
    }

    // Migrasi transparan: bila parameter Argon2id dinaikkan di masa depan,
    // hash dihitung ulang saat login berhasil sehingga user ikut berpindah
    // tanpa perlu reset password. Password polos hanya ada di sini, jadi ini
    // satu-satunya kesempatan melakukannya.
    if (passwordNeedsRehash(user.passwordHash)) {
      await db
        .update(users)
        .set({ passwordHash: await hashPassword(data.password) })
        .where(eq(users.id, user.id));
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

  async forgotPassword(dto: ForgotPasswordRequest): Promise<{ msg: string }> {
    const data = forgotPasswordRequestSchema.parse(dto);
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
      throw new UnauthorizedException(
        'User tidak ditemukan, tolong periksa kembali username atau email kamu',
      );
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Akun tidak aktif. Hubungi admin');
    }

    // Cooldown via cache: semantik TTL, self-cleaning, dan tidak butuh baris DB
    // tambahan. Ini SATU-SATUNYA peran cache di alur ini — tokennya sendiri
    // selalu disimpan di DB (lihat `findActivePasswordReset`).
    const cooldownKey = `forgot-password:cooldown:${user.id}`;
    if (await cache.get(cooldownKey)) {
      throw new BadRequestException(
        `Mohon tunggu ${RESEND_COOLDOWN_SECONDS} detik sebelum meminta kode baru`,
      );
    }

    const token = generateForgotPasswordToken();
    const tokenHash = sha256(token);

    // Hanya SATU token aktif per user: meminta kode baru membatalkan kode lama,
    // sehingga kode yang masih beredar di inbox tidak bisa dipakai lagi. Ini
    // sekaligus membersihkan baris yang sudah terpakai / kedaluwarsa.
    await db
      .delete(userPasswordResets)
      .where(eq(userPasswordResets.userId, user.id));

    await db.insert(userPasswordResets).values({
      userId: user.id,
      tokenHash,
      expiresAt: dayjs().add(FORGOT_PASSWORD_TTL_MINUTES, 'minute').toDate(),
    });

    // Kirim email — best-effort, gagal kirim tidak membatalkan token
    try {
      await this.emailService.sendForgotPassword(user.email, token);
      // Cooldown dipasang SETELAH email terkirim: bila SMTP gagal, user tidak
      // terjebak menunggu 60 detik tanpa pernah menerima kode apa pun.
      await cache.set(cooldownKey, 1, RESEND_COOLDOWN_SECONDS);
    } catch {
      // Log sudah dilakukan di EmailService. Token tetap ada di DB, jadi user
      // bisa langsung mencoba kirim ulang.
    }

    return { msg: 'Token reset password berhasil dikirim ke email Anda' };
  }

  async verifyForgotPasswordToken(token: string) {
    await this.findActivePasswordReset(token);
    return { msg: 'Token reset password valid' };
  }

  async resetPassword(dto: ResetPasswordRequest) {
    const data = resetPasswordRequestSchema.parse(dto);
    const hashedPassword = await hashPassword(data.password);

    // Dibaca dari DB — sumber kebenaran yang SAMA dengan verify.
    const resetRow = await this.findActivePasswordReset(data.token);

    await db
      .update(users)
      .set({ passwordHash: hashedPassword })
      .where(eq(users.id, resetRow.userId));

    await db
      .update(userPasswordResets)
      .set({ usedAt: new Date() })
      .where(eq(userPasswordResets.id, resetRow.id));

    return { msg: 'Password berhasil direset' };
  }

  /**
   * Cari token reset password yang SAH: hash cocok, belum kedaluwarsa, dan
   * belum terpakai. Melempar bila tidak ada.
   *
   * Sumber kebenaran adalah DB, bukan cache. Sebelumnya
   * `verifyForgotPasswordToken` membaca cache saja sementara `resetPassword`
   * membaca DB, sehingga token yang masih valid di DB bisa ditolak hanya
   * karena cache kosong (mis. setelah Valkey restart) — kegagalan yang
   * bergantung infrastruktur dan membingungkan user.
   */
  private async findActivePasswordReset(token: string) {
    const tokenHash = sha256(token.trim());

    const [row] = await db
      .select()
      .from(userPasswordResets)
      .where(
        and(
          eq(userPasswordResets.tokenHash, tokenHash),
          isNull(userPasswordResets.usedAt),
          gt(userPasswordResets.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!row) {
      throw new UnauthorizedException(
        'Token reset password tidak valid atau kadaluarsa',
      );
    }

    return row;
  }

  // ---------------------------------------------------------------------------
  // Me / sessions
  // ---------------------------------------------------------------------------

  /**
   * Profil user + preferensi tenant "terakhir dipakai" untuk session ini.
   *
   * Tenant di sini BUKAN otorisasi — tenant aktif ditentukan URL dan
   * diverifikasi `TenantGuard`. Nilai ini dipakai klien untuk redirect setelah
   * login (mis. membuka `landingPath()`).
   */
  async getMe(userId: number, sessionId: string): Promise<MeResponse> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const preferenceId =
      await this.sessionService.getTenantPreferenceForSession(sessionId);
    const tenant = preferenceId
      ? await this.sessionService.getTenantByPublicIdForUser(
          userId,
          preferenceId,
        )
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
