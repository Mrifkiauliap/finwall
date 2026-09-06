import {
  and,
  db,
  desc,
  eq,
  isNull,
  tenantUsers,
  tenants,
  users,
} from '@finwall/db';
import {
  type CreateTenantRequest,
  type SessionMeta,
  type SwitchTenantRequest,
  type TenantAuthResponse,
  type TenantInfo,
  type TenantListResponse,
  TenantMemberInfo,
  TenantMemberListResponse,
  createTenantRequestSchema,
  switchTenantRequestSchema,
  tenantAuthResponseSchema,
  tenantListResponseSchema,
  tenantMemberListResponseSchema,
} from '@finwall/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { cache } from '@finwall/cache';
import { toSafeUser } from '../auth.service.js';
import { SessionService } from '../session/session.service.js';

@Injectable()
export class TenantService {
  constructor(private readonly sessionService: SessionService) {}

  /** Semua tenant yang bisa diakses user, dengan peran masing-masing. */
  async listTenants(
    userId: number,
    currentTenantId: string | null,
  ): Promise<TenantListResponse> {
    const cachedTenants = await cache.get(`tenant:list:${userId}`);
    if (cachedTenants) {
      return tenantListResponseSchema.parse(cachedTenants);
    }

    const rows = await db
      .select({
        tenantPublicId: tenants.publicId,
        tenantName: tenants.name,
        tenantCreatedAt: tenants.createdAt,
        role: tenantUsers.role,
      })
      .from(tenantUsers)
      .innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
      .where(and(eq(tenantUsers.userId, userId), isNull(tenants.deletedAt)))
      .orderBy(desc(tenants.createdAt));

    const list: TenantInfo[] = rows.map((r) => ({
      publicId: r.tenantPublicId,
      name: r.tenantName,
      role: r.role,
      isCurrent: r.tenantPublicId === currentTenantId,
      createdAt: r.tenantCreatedAt.toISOString(),
    }));

    await cache.set(`tenant:list:${userId}`, { tenants: list }, 300);
    return tenantListResponseSchema.parse({ tenants: list });
  }

  /** Ambil semua member tenant dari user yang aktif pada tenantnya. */
  async getTenantMember(
    userId: number,
    currentTenantId: string | null,
  ): Promise<TenantMemberListResponse> {
    // Kalau tidak ada tenant aktif, kembalikan list kosong
    if (!currentTenantId) {
      return tenantMemberListResponseSchema.parse({ members: [] });
    }

    const cachedMembers = await cache.get(`tenant:member:${userId}`);
    if (cachedMembers) {
      return tenantMemberListResponseSchema.parse(cachedMembers);
    }

    const rows = await db
      .select({
        tenantPublicId: tenants.publicId,
        tenantName: tenants.name,
        role: tenantUsers.role,
        userId: tenantUsers.userId,
        username: users.username,
        email: users.email,
        isActive: users.isActive,
        joinedAt: tenantUsers.createdAt,
      })
      .from(tenantUsers)
      .innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
      .innerJoin(users, eq(tenantUsers.userId, users.id))
      .where(
        and(eq(tenants.publicId, currentTenantId), isNull(tenants.deletedAt)),
      )
      .orderBy(desc(tenantUsers.createdAt));

    const list: TenantMemberInfo[] = rows.map((r) => ({
      publicId: r.tenantPublicId,
      username: r.username,
      email: r.email,
      role: r.role,
      isActive: r.isActive,
      isCurrent: r.userId === userId,
      joinedAt: r.joinedAt.toISOString(), // Ini waktu join member ke tenant
    }));

    await cache.set(`tenant:member:${userId}`, { members: list }, 300);
    return tenantMemberListResponseSchema.parse({ members: list });
  }

  /** Buat tenant baru milik user (user jadi owner) + jadikan tenant aktif. */
  async createTenant(
    userId: number,
    dto: CreateTenantRequest,
    meta: SessionMeta,
  ): Promise<TenantAuthResponse> {
    const { name } = createTenantRequestSchema.parse(dto);

    const [exists] = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.name, name), isNull(tenants.deletedAt)))
      .limit(1);

    if (exists) {
      throw new BadRequestException('Nama tenant sudah ada, coba nama lain');
    }

    const [created] = await db.insert(tenants).values({ name }).returning({
      id: tenants.id,
      publicId: tenants.publicId,
      name: tenants.name,
    });

    await db.insert(tenantUsers).values({
      tenantId: created.id,
      userId,
      role: 'owner',
    });

    const tenant = { publicId: created.publicId, name: created.name };

    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const tokens = await this.sessionService.rotateLatestSessionForUser(
      userId,
      tenant.publicId,
      meta,
    );

    return tenantAuthResponseSchema.parse({
      user: toSafeUser(user),
      tenant,
      tokens,
    });
  }

  /** Ganti tenant aktif session ini + terbitkan token baru. */
  async switchTenant(
    userId: number,
    dto: SwitchTenantRequest,
    meta: SessionMeta,
  ): Promise<TenantAuthResponse> {
    const { tenantId } = switchTenantRequestSchema.parse(dto);

    const tenant = await this.getTenantForUser(userId, tenantId);
    if (!tenant) {
      throw new ForbiddenException('Kamu tidak punya akses ke tenant ini');
    }

    const user = await this.getUserById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User tidak ditemukan atau tidak aktif');
    }

    const tokens = await this.sessionService.rotateLatestSessionForUser(
      userId,
      tenant.publicId,
      meta,
    );

    return tenantAuthResponseSchema.parse({
      user: toSafeUser(user),
      tenant,
      tokens,
    });
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

  /** Tenant by publicId, hanya bila user adalah member-nya. */
  private async getTenantForUser(userId: number, tenantPublicId: string) {
    const [row] = await db
      .select({ publicId: tenants.publicId, name: tenants.name })
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

    return row ?? null;
  }
}
