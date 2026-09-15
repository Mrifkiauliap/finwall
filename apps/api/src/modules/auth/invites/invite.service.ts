import {
  and,
  db,
  desc,
  eq,
  isNull,
  ne,
  tenantInvites,
  tenantUsers,
  tenants,
  users,
} from '@finwall/db';
import {
  type CreateInviteRequest,
  type InviteCodeResponse,
  type JoinTenantRequest,
  type JoinTenantResponse,
  type PendingInviteInfo,
  type PendingInvitesResponse,
  type SessionMeta,
  type TenantInviteInfo,
  type TenantInviteListResponse,
  createInviteRequestSchema,
  inviteCodeResponseSchema,
  joinTenantRequestSchema,
  pendingInvitesResponseSchema,
  tenantInviteListResponseSchema,
} from '@finwall/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  generateInviteCode,
  normalizeInviteCode,
  sha256,
} from '../../../core/utils/crypto.js';
import { toSafeUser } from '../auth.service.js';
import { NULL_TENANT, SessionService } from '../session/session.service.js';

const INVITE_DEFAULT_TTL_HOURS = 72;
const INVITE_OWNER_ROLES = ['owner', 'admin'] as const;

@Injectable()
export class InviteService {
  constructor(private readonly sessionService: SessionService) {}

  // ---------------------------------------------------------------------------
  // Owner / admin tenant
  // ---------------------------------------------------------------------------

  /** Generate undangan (terbuka via kode, atau by email) — owner/admin only. */
  async generateInvite(
    userId: number,
    tenantPublicId: string,
    dto: CreateInviteRequest,
  ): Promise<InviteCodeResponse> {
    const data = createInviteRequestSchema.parse(dto);
    const role = data.role ?? 'member';
    const ttlHours = data.expiresInHours ?? INVITE_DEFAULT_TTL_HOURS;
    const email = data.email?.trim().toLowerCase() || null;

    const tenant = await this.requireTenantRole(
      userId,
      tenantPublicId,
      INVITE_OWNER_ROLES,
    );
    if (!tenant)
      throw new ForbiddenException(
        'Hanya owner/admin tenant yang bisa mengundang',
      );

    // Sebab owner cuman 1 tapi admin boleh lebih dari 1
    if (role === 'owner')
      throw new ConflictException('Kamu tidak bisa mengundang sebagai owner.');

    let code: string | null = null;
    if (email) {
      const [existEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!existEmail)
        throw new ConflictException(
          'Email yang kamu undang tidak terdaftar dalam sistem.',
        );

      const [dup] = await db
        .select({ id: tenantInvites.id })
        .from(tenantInvites)
        .where(
          and(
            eq(tenantInvites.tenantId, tenant.id),
            eq(tenantInvites.inviteeEmail, email),
            eq(tenantInvites.status, 'pending'),
          ),
        )
        .limit(1);
      if (dup)
        throw new ConflictException(
          'Undangan utk email ini sudah ada (pending)',
        );
    } else {
      code = generateInviteCode();
    }

    const codeHash = code ? sha256(normalizeInviteCode(code)) : null;
    const expiresAt = new Date(
      Date.now() + Math.max(1, ttlHours) * 60 * 60 * 1000,
    );

    const [invite] = await db
      .insert(tenantInvites)
      .values({
        tenantId: tenant.id,
        invitedById: userId,
        inviteeEmail: email,
        codeHash,
        role,
        status: 'pending',
        expiresAt,
      })
      .returning({
        publicId: tenantInvites.publicId,
        expiresAt: tenantInvites.expiresAt,
      });

    return inviteCodeResponseSchema.parse({
      inviteId: invite.publicId,
      code,
      expiresAt: invite.expiresAt ? invite.expiresAt.toISOString() : null,
    });
  }

  /** Daftar undangan milik tenant — owner/admin only. */
  async listTenantInvites(
    userId: number,
    tenantPublicId: string,
  ): Promise<TenantInviteListResponse> {
    const tenant = await this.requireTenantRole(
      userId,
      tenantPublicId,
      INVITE_OWNER_ROLES,
    );
    if (!tenant)
      throw new ForbiddenException(
        'Hanya owner/admin tenant yang bisa melihat undangan',
      );

    const rows = await db
      .select()
      .from(tenantInvites)
      .where(
        and(
          eq(tenantInvites.tenantId, tenant.id),
          ne(tenantInvites.status, 'rejected'),
        ),
      )
      .orderBy(desc(tenantInvites.createdAt));

    const invites: TenantInviteInfo[] = rows.map((r) => ({
      id: r.publicId,
      email: r.inviteeEmail,
      role: r.role,
      status: r.status,
      expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    }));

    return tenantInviteListResponseSchema.parse({ invites });
  }

  /** Batalkan undangan (owner/admin tenant). */
  async revokeInvite(
    userId: number,
    tenantPublicId: string,
    invitePublicId: string,
  ): Promise<{ message: string }> {
    const tenant = await this.requireTenantRole(
      userId,
      tenantPublicId,
      INVITE_OWNER_ROLES,
    );
    if (!tenant)
      throw new ForbiddenException(
        'Hanya owner/admin tenant yang bisa membatalkan undangan',
      );

    await db
      .update(tenantInvites)
      .set({ status: 'rejected' })
      .where(
        and(
          eq(tenantInvites.publicId, invitePublicId),
          eq(tenantInvites.tenantId, tenant.id),
        ),
      );

    return { message: 'Undangan dibatalkan' };
  }

  // ---------------------------------------------------------------------------
  // Invitee
  // ---------------------------------------------------------------------------

  /** Daftar undangan pending utk email user (by email). */
  async listPendingInvitesForUser(
    userId: number,
  ): Promise<PendingInvitesResponse> {
    const user = await this.getUserById(userId);
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const email = user.email.toLowerCase();

    const rows = await db
      .select({
        publicId: tenantInvites.publicId,
        inviteeEmail: tenantInvites.inviteeEmail,
        role: tenantInvites.role,
        status: tenantInvites.status,
        expiresAt: tenantInvites.expiresAt,
        createdAt: tenantInvites.createdAt,
        tenantPublicId: tenants.publicId,
        tenantName: tenants.name,
      })
      .from(tenantInvites)
      .innerJoin(tenants, eq(tenantInvites.tenantId, tenants.id))
      .where(
        and(
          eq(tenantInvites.inviteeEmail, email),
          eq(tenantInvites.status, 'pending'),
          isNull(tenants.deletedAt),
        ),
      )
      .orderBy(desc(tenantInvites.createdAt));

    const invites: PendingInviteInfo[] = rows.map((r) => ({
      id: r.publicId,
      email: r.inviteeEmail,
      role: r.role,
      status: r.status,
      expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      tenantPublicId: r.tenantPublicId,
      tenantName: r.tenantName,
    }));

    return pendingInvitesResponseSchema.parse({ invites });
  }

  /** Terima undangan by email -> jadi member tenant + jadikan aktif. */
  async acceptInvite(
    userId: number,
    invitePublicId: string,
    meta: SessionMeta,
  ): Promise<JoinTenantResponse> {
    const user = await this.getUserById(userId);
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const invite = await this.findOwnPendingInvite(user, invitePublicId);

    await db
      .update(tenantInvites)
      .set({ status: 'accepted' })
      .where(eq(tenantInvites.id, invite.id));

    const membership = await this.ensureMembership(
      invite.tenantId,
      userId,
      invite.role,
    );

    const tenant = await this.getTenantByPublicId(invite.tenantPublicId);
    const tokens = await this.sessionService.rotateLatestSessionForUser(
      userId,
      invite.tenantPublicId,
      meta,
    );

    await this.sessionService.invalidateUserCaches(userId, user.publicId);

    return {
      user: toSafeUser(user),
      tenant: {
        publicId: tenant?.publicId ?? invite.tenantPublicId,
        name: tenant?.name ?? invite.tenantName,
        role: membership.role,
      },
      tokens,
    };
  }

  /** Tolak undangan by email. */
  async rejectInvite(
    userId: number,
    invitePublicId: string,
  ): Promise<{ message: string }> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const invite = await this.findOwnPendingInvite(user, invitePublicId);

    await db
      .update(tenantInvites)
      .set({ status: 'rejected' })
      .where(eq(tenantInvites.id, invite.id));

    return { message: 'Undangan ditolak' };
  }

  /** Join undangan TERBUKA memakai kode. */
  async joinByInviteCode(
    userId: number,
    dto: JoinTenantRequest,
    meta: SessionMeta,
  ): Promise<JoinTenantResponse> {
    const data = joinTenantRequestSchema.parse(dto);
    const code = normalizeInviteCode(data.code);
    const codeHash = sha256(code);

    const [invite] = await db
      .select()
      .from(tenantInvites)
      .where(
        and(
          eq(tenantInvites.codeHash, codeHash),
          eq(tenantInvites.status, 'pending'),
        ),
      )
      .limit(1);

    if (!invite) {
      throw new BadRequestException('Kode undangan tidak valid');
    }
    if (invite.expiresAt && invite.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Kode undangan sudah kedaluwarsa');
    }

    const [tenantRow] = await db
      .select({ publicId: tenants.publicId, name: tenants.name })
      .from(tenants)
      .where(and(eq(tenants.id, invite.tenantId), isNull(tenants.deletedAt)))
      .limit(1);
    if (!tenantRow) {
      throw new NotFoundException('Tenant tidak ditemukan');
    }

    // Cegah masuk ke tenant milik sendiri / sudah member.
    const [alreadyMember] = await db
      .select({ id: tenantUsers.id })
      .from(tenantUsers)
      .where(
        and(
          eq(tenantUsers.userId, userId),
          eq(tenantUsers.tenantId, invite.tenantId),
        ),
      )
      .limit(1);
    if (alreadyMember) {
      throw new BadRequestException('Kamu sudah menjadi member tenant ini');
    }

    const membership = await this.ensureMembership(
      invite.tenantId,
      userId,
      invite.role,
    );
    await db
      .update(tenantInvites)
      .set({ status: 'accepted' })
      .where(eq(tenantInvites.id, invite.id));

    const user = await this.getUserById(userId);
    const tokens = await this.sessionService.rotateLatestSessionForUser(
      userId,
      tenantRow.publicId,
      meta,
    );

    await this.sessionService.invalidateUserCaches(
      userId,
      user?.publicId ?? null,
    );

    return {
      user: toSafeUser(user!),
      tenant: {
        publicId: tenantRow.publicId,
        name: tenantRow.name,
        role: membership.role,
      },
      tokens,
    };
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

  private async getTenantByPublicId(tenantPublicId: string) {
    const [tenant] = await db
      .select({
        id: tenants.id,
        publicId: tenants.publicId,
        name: tenants.name,
      })
      .from(tenants)
      .where(
        and(eq(tenants.publicId, tenantPublicId), isNull(tenants.deletedAt)),
      )
      .limit(1);

    return tenant ?? null;
  }

  /** Cek role user dalam tenant; kembalikan tenant bila role diizinkan. */
  private async requireTenantRole(
    userId: number,
    tenantPublicId: string,
    allowedRoles: readonly ('owner' | 'admin' | 'member' | 'viewer')[],
  ) {
    const [row] = await db
      .select({
        id: tenants.id,
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

    if (!row) return null;
    if (!allowedRoles.includes(row.role)) return null;
    return row;
  }

  /** Undangan pending milik user (by email) utk accept/reject. */
  private async findOwnPendingInvite(
    user: { id: number; email: string },
    invitePublicId: string,
  ) {
    const [row] = await db
      .select({
        id: tenantInvites.id,
        tenantId: tenantInvites.tenantId,
        role: tenantInvites.role,
        expiresAt: tenantInvites.expiresAt,
        tenantPublicId: tenants.publicId,
        tenantName: tenants.name,
      })
      .from(tenantInvites)
      .innerJoin(tenants, eq(tenantInvites.tenantId, tenants.id))
      .where(
        and(
          eq(tenantInvites.publicId, invitePublicId),
          eq(tenantInvites.inviteeEmail, user.email.toLowerCase()),
          eq(tenantInvites.status, 'pending'),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException('Undangan tidak ditemukan');
    }
    if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Undangan sudah kedaluwarsa');
    }

    return row;
  }

  /** Tambah membership bila belum ada. */
  private async ensureMembership(
    tenantId: number,
    userId: number,
    role: 'owner' | 'admin' | 'member' | 'viewer',
  ) {
    const [existing] = await db
      .select({
        id: tenantUsers.id,
        role: tenantUsers.role,
      })
      .from(tenantUsers)
      .where(
        and(eq(tenantUsers.tenantId, tenantId), eq(tenantUsers.userId, userId)),
      )
      .limit(1);

    if (existing) return existing;

    const [created] = await db
      .insert(tenantUsers)
      .values({
        tenantId,
        userId,
        role,
      })
      .returning({
        id: tenantUsers.id,
        role: tenantUsers.role,
      });

    return created;
  }
}

export { NULL_TENANT };
