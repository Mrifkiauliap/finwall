import { db } from '@finwall/db';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailService } from '../email/email.service.js';
import { AuthService } from './auth.service.js';
import { SessionService } from './session/session.service.js';

// Argon2id adalah modul native (Rust). Di test, hashing nyata tidak relevan —
// yang diuji adalah alur service — jadi modulnya di-mock agar cepat & bebas
// ketergantungan binari per platform.
vi.mock('@finwall/shared/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('$argon2id$mocked'),
  verifyPassword: vi.fn().mockResolvedValue(true),
  passwordNeedsRehash: vi.fn().mockReturnValue(false),
}));

vi.mock('@finwall/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
  },
  sessionStore: {
    saveActive: vi.fn(),
    isActive: vi.fn(),
    touch: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@finwall/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  users: {
    id: 'id',
    email: 'email',
    username: 'username',
    phone: 'phone',
    publicId: 'publicId',
    avatarUrl: 'avatarUrl',
    passwordHash: 'passwordHash',
    deletedAt: 'deletedAt',
    isActive: 'isActive',
    timezone: 'timezone',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  sessions: {
    id: 'id',
    publicId: 'publicId',
    userId: 'userId',
    refreshTokenHash: 'refreshTokenHash',
    expiresAt: 'expiresAt',
    revokedAt: 'revokedAt',
    lastActiveAt: 'lastActiveAt',
    tenantId: 'tenantId',
    userAgent: 'userAgent',
    ipAddress: 'ipAddress',
    device: 'device',
  },
  tenants: {
    id: 'id',
    publicId: 'publicId',
    name: 'name',
    deletedAt: 'deletedAt',
    createdAt: 'createdAt',
  },
  tenantUsers: {
    id: 'id',
    userId: 'userId',
    tenantId: 'tenantId',
    role: 'role',
    createdAt: 'createdAt',
  },
  tenantInvites: {
    id: 'id',
    publicId: 'publicId',
    tenantId: 'tenantId',
    invitedById: 'invitedById',
    inviteeEmail: 'inviteeEmail',
    codeHash: 'codeHash',
    role: 'role',
    status: 'status',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
  },
  userEmailVerifications: {
    id: 'id',
    userId: 'userId',
    tokenHash: 'tokenHash',
    expiresAt: 'expiresAt',
    usedAt: 'usedAt',
    createdAt: 'createdAt',
  },
  userPasswordResets: {
    id: 'id',
    userId: 'userId',
    tokenHash: 'tokenHash',
    expiresAt: 'expiresAt',
    usedAt: 'usedAt',
    createdAt: 'createdAt',
  },
  and: vi.fn(),
  eq: vi.fn(),
  isNull: vi.fn(),
  or: vi.fn(),
  gt: vi.fn(),
  ne: vi.fn(),
  desc: vi.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        SessionService,
        {
          provide: JwtService,
          useValue: {
            signAsync: vi.fn().mockResolvedValue('mock_token'),
            verifyAsync: vi.fn(),
          },
        },
        {
          // EmailService di-inject AuthService sejak alur verifikasi email
          // ditambahkan; di sini cukup di-stub karena tidak ada SMTP di test.
          provide: EmailService,
          useValue: {
            send: vi.fn().mockResolvedValue(undefined),
            sendForgotPassword: vi.fn().mockResolvedValue(undefined),
            sendVerifyEmail: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('should reject when fields are invalid', async () => {
      await expect(
        authService.signup({
          username: 'ab',
          email: 'not-an-email',
          password: 'short',
        }),
      ).rejects.toThrow();
    });

    it('should reject when password lacks required classes', async () => {
      await expect(
        authService.signup({
          username: 'user1',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow();
    });
  });

  describe('signin', () => {
    it('should reject when identifier is empty', async () => {
      await expect(
        authService.signin({ identifier: '', password: 'password' }),
      ).rejects.toThrow();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // signin schema valid, db returns empty -> UnauthorizedException.
      // Pesan sengaja GENERIK (sama utk user tidak ada & password salah) supaya
      // tidak membocorkan keberadaan akun (anti user-enumeration).
      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      (db.select as any) = selectMock;

      await expect(
        authService.signin({
          identifier: 'nonexistent@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow('Kredensial kamu tidak valid atau password salah');
    });
  });
});
