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
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard.js';
import { throwZodBadRequest } from '../../../core/utils/zod.js';
import { SessionService } from '../session/session.service.js';
import { TenantService } from './tenant.service.js';

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const secure = process.env.NODE_ENV === 'production';

@Controller('auth')
export class TenantController {
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

  /**
   * @deprecated Gunakan `GET /tenants` (TenantResourceController).
   * Dipertahankan untuk kompatibilitas selama migrasi.
   */
  @UseGuards(JwtAuthGuard)
  @Get('tenants')
  async listTenants(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TenantListResponse> {
    const preferenceId =
      await this.sessionService.getTenantPreferenceForSession(user.sessionId);
    return this.tenantService.listTenants(user.id, preferenceId);
  }

  /**
   * @deprecated Gunakan `GET /tenants/:tenantPublicId/members`.
   * Dipertahankan untuk kompatibilitas selama migrasi.
   */
  @UseGuards(JwtAuthGuard)
  @Get('tenant/members')
  async getTenantMember(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TenantMemberListResponse> {
    const preferenceId =
      await this.sessionService.getTenantPreferenceForSession(user.sessionId);
    return this.tenantService.getTenantMember(user.id, preferenceId);
  }

  /** Buat tenant sendiri (jadi owner + aktif) dan terbitkan token baru. */
  @UseGuards(JwtAuthGuard)
  @Post('tenant')
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

  /** Ganti tenant aktif session ini + terbitkan token baru. */
  @UseGuards(JwtAuthGuard)
  @Post('switch-tenant')
  @HttpCode(HttpStatus.OK)
  async switchTenant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SwitchTenantRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TenantAuthResponse> {
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
