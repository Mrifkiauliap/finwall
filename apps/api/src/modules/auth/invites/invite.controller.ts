import {
  type AuthenticatedUser,
  type CookieTokens,
  type CreateInviteRequest,
  type InviteCodeResponse,
  type JoinTenantRequest,
  type JoinTenantResponse,
  type PendingInvitesResponse,
  type SessionMeta,
  type TenantInviteListResponse,
  cookieTokensSchema,
  createInviteRequestSchema,
  joinTenantRequestSchema,
} from '@finwall/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard.js';
import { throwZodBadRequest } from '../../../core/utils/zod.js';
import { InviteService } from './invite.service.js';

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const secure = process.env.NODE_ENV === 'production';

@Controller('auth')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

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

  private toJoinResponse(
    res: Response,
    result: JoinTenantResponse,
  ): JoinTenantResponse {
    this.setAuthCookies(res, cookieTokensSchema.parse(result.tokens));
    return result;
  }

  // ---------------------------------------------------------------------------
  // Undangan (owner/admin)
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Post('tenant/:tenantId/invites')
  @HttpCode(HttpStatus.CREATED)
  async generateInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateInviteRequest,
  ): Promise<InviteCodeResponse> {
    const parsed = createInviteRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throwZodBadRequest(parsed.error);
    }

    return this.inviteService.generateInvite(user.id, tenantId, parsed.data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tenant/:tenantId/invites')
  async listTenantInvites(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tenantId') tenantId: string,
  ): Promise<TenantInviteListResponse> {
    return this.inviteService.listTenantInvites(user.id, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('tenant/:tenantId/invites/:inviteId')
  async revokeInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tenantId') tenantId: string,
    @Param('inviteId') inviteId: string,
  ): Promise<{ message: string }> {
    return this.inviteService.revokeInvite(user.id, tenantId, inviteId);
  }

  // ---------------------------------------------------------------------------
  // Undangan (invitee)
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('invite/pending')
  async listPendingInvites(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PendingInvitesResponse> {
    return this.inviteService.listPendingInvitesForUser(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invite/:inviteId/accept')
  @HttpCode(HttpStatus.OK)
  async acceptInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('inviteId') inviteId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<JoinTenantResponse> {
    const result = await this.inviteService.acceptInvite(
      user.id,
      inviteId,
      this.extractSessionMeta(req),
    );
    return this.toJoinResponse(res, result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invite/:inviteId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('inviteId') inviteId: string,
  ): Promise<{ message: string }> {
    return this.inviteService.rejectInvite(user.id, inviteId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tenant/join')
  @HttpCode(HttpStatus.OK)
  async joinByCode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: JoinTenantRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<JoinTenantResponse> {
    const parsed = joinTenantRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throwZodBadRequest(parsed.error);
    }

    const result = await this.inviteService.joinByInviteCode(
      user.id,
      parsed.data,
      this.extractSessionMeta(req),
    );
    return this.toJoinResponse(res, result);
  }
}
