import {
  type AuthenticatedUser,
  type CookieTokens,
  type CreateTenantRequest,
  type SessionMeta,
  type SwitchTenantRequest,
  type TenantAuthResponse,
  type TenantListResponse,
  TenantMemberListResponse,
  cookieTokensSchema,
  createTenantRequestSchema,
  switchTenantRequestSchema,
} from '@finwall/shared';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  CurrentTenant,
  type RequestTenant,
} from '../../../core/decorators/current-tenant.decorator.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard.js';
import { TenantGuard } from '../../../core/guards/tenant.guard.js';
import { throwZodBadRequest } from '../../../core/utils/zod.js';
import { SessionService } from '../session/session.service.js';
import { TenantService } from './tenant.service.js';

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const secure = process.env.NODE_ENV === 'production';

const MEMBER_READ_ROLES = ['owner', 'admin'] as const;

/**
 * Endpoint tenant-scoped kanonik: tenant aktif berasal dari `tenantPublicId`
 * di URL, bukan dari klaim token.
 *
 * ```text
 * GET  /tenants
 * GET  /tenants/:tenantPublicId
 * GET  /tenants/:tenantPublicId/members
 * POST /tenants
 * POST /tenants/:tenantPublicId/switch
 * ```
 *
 * Setiap endpoint ber-`:tenantPublicId` melewati `TenantGuard` yang
 * memverifikasi keanggotaan user sebelum resource diakses.
 */
@Controller('tenants')
export class TenantResourceController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly sessionService: SessionService,
  ) {}

  private setAuthCookies(res: Response, tokens: CookieTokens): void {
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: ACCESS_COOKIE_MAX_AGE,
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  }

  private extractSessionMeta(req: Request): SessionMeta {
    const userAgent = req.headers['user-agent'] ?? null;
    const forwarded = req.headers['x-forwarded-for'];
    const rawIp =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded) ??
      req.socket?.remoteAddress ??
      null;
    const ipAddress = rawIp ? rawIp.split(',')[0].trim() : null;

    return { userAgent, ipAddress, device: userAgent };
  }

  private toTenantAuthResponse(
    res: Response,
    result: TenantAuthResponse,
  ): TenantAuthResponse {
    this.setAuthCookies(res, cookieTokensSchema.parse(result.tokens));
    return result;
  }

  // ---------------------------------------------------------------------------
  // Tenant milik user
  // ---------------------------------------------------------------------------

  /** Semua tenant yang bisa diakses user (identitas saja, tanpa tenant di URL). */
  @UseGuards(JwtAuthGuard)
  @Get()
  async listTenants(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TenantListResponse> {
    const preferenceId =
      await this.sessionService.getTenantPreferenceForSession(user.sessionId);
    return this.tenantService.listTenants(user.id, preferenceId);
  }

  /** Detail tenant dari URL — sudah diverifikasi keanggotaannya oleh TenantGuard. */
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get(':tenantPublicId')
  async getTenant(
    @CurrentTenant() tenant: RequestTenant,
  ): Promise<RequestTenant> {
    return tenant;
  }

  /** Anggota tenant dari URL. Hanya owner/admin. */
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get(':tenantPublicId/members')
  async getTenantMembers(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: RequestTenant,
  ): Promise<TenantMemberListResponse> {
    if (!MEMBER_READ_ROLES.includes(tenant.role as 'owner' | 'admin')) {
      throw new ForbiddenException(
        'Hanya owner/admin yang bisa melihat anggota',
      );
    }

    return this.tenantService.getTenantMember(user.id, tenant.publicId);
  }

  // ---------------------------------------------------------------------------
  // Membuat & berpindah tenant
  // ---------------------------------------------------------------------------

  /** Buat workspace baru (user jadi owner) lalu jadikan aktif. */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTenant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTenantRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TenantAuthResponse> {
    const parsed = createTenantRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throwZodBadRequest(parsed.error);
    }

    const result = await this.tenantService.createTenant(
      user.id,
      parsed.data,
      this.extractSessionMeta(req),
    );
    return this.toTenantAuthResponse(res, result);
  }

  /**
   * Set tenant "terakhir dipakai" sebagai preferensi session.
   *
   * Keanggotaan diverifikasi `TenantGuard` dari `tenantPublicId` di URL.
   */
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Post(':tenantPublicId/switch')
  @HttpCode(HttpStatus.OK)
  async switchTenant(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: RequestTenant,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TenantAuthResponse> {
    const dto: SwitchTenantRequest = { tenantId: tenant.publicId };
    const parsed = switchTenantRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throwZodBadRequest(parsed.error);
    }

    const result = await this.tenantService.switchTenant(
      user.id,
      parsed.data,
      this.extractSessionMeta(req),
    );
    return this.toTenantAuthResponse(res, result);
  }
}
