import {
  type AuthenticatedUser,
  type AuthResponse,
  authTokensSchema,
  type CookieTokens,
  cookieTokensSchema,
  currentTenantSchema,
  currentUserSchema,
  type ForgotPasswordRequest,
  forgotPasswordRequestSchema,
  type LogoutResponse,
  type MeResponse,
  meResponseSchema,
  type ResendVerificationResponse,
  type ResetPasswordRequest,
  resetPasswordRequestSchema,
  type SessionListResponse,
  type SessionMeta,
  type SigninRequest,
  signinRequestSchema,
  type SignupRequest,
  signupRequestSchema,
  type VerifyEmailRequest,
  type VerifyEmailResponse,
  verifyEmailRequestSchema,
} from '@finwall/shared';
import {
  BadRequestException,
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
import { CurrentUser } from '../../core/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../core/guards/jwt.guard.js';
import { throwZodBadRequest } from '../../core/utils/zod.js';
import { AuthService } from './auth.service.js';

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 menit
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 hari

const secure = process.env.NODE_ENV === 'production';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  private clearAuthCookies(res: Response): void {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
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

  private toAuthResponse(res: Response, result: AuthResponse): AuthResponse {
    const tokens = cookieTokensSchema.parse(result.tokens);
    this.setAuthCookies(res, tokens);
    return {
      user: currentUserSchema.parse(result.user),
      tenant: currentTenantSchema.parse(result.tenant),
      tokens: authTokensSchema.parse(result.tokens),
    };
  }

  // ---------------------------------------------------------------------------
  // Auth inti
  // ---------------------------------------------------------------------------

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body() dto: SignupRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const parsed = signupRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throwZodBadRequest(parsed.error);
    }

    const result = await this.authService.signup(
      parsed.data,
      this.extractSessionMeta(req),
    );
    return this.toAuthResponse(res, result);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(
    @Body() dto: SigninRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const parsed = signinRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throwZodBadRequest(parsed.error);
    }

    const result = await this.authService.signin(
      parsed.data,
      this.extractSessionMeta(req),
    );
    return this.toAuthResponse(res, result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: { refreshToken?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const token =
      body?.refreshToken ||
      (req.cookies?.['refresh_token'] as string | undefined) ||
      req.headers['x-refresh-token']?.toString();

    if (!token) {
      throw new BadRequestException({
        errors: [{ path: ['refreshToken'], code: 'REFRESH_TOKEN_REQUIRED' }],
      });
    }

    const result = await this.authService.refreshToken(token);
    return this.toAuthResponse(res, result);
  }

  //forgot password (tidak memerlukan sesi aktif)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordRequest,
  ): Promise<{ msg: string }> {
    const parsed = forgotPasswordRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throwZodBadRequest(parsed.error);
    }
    return this.authService.forgotPassword(parsed.data);
  }

  @Post('verify-forgot-password-token')
  @HttpCode(HttpStatus.OK)
  async verifyForgotPasswordToken(
    @Body() body: { token: string },
  ): Promise<{ msg: string }> {
    return this.authService.verifyForgotPasswordToken(body.token);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordRequest,
  ): Promise<{ msg: string }> {
    const parsed = resetPasswordRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throwZodBadRequest(parsed.error);
    }
    return this.authService.resetPassword(parsed.data);
  }

  // ---------------------------------------------------------------------------
  // Verifikasi email
  // ---------------------------------------------------------------------------
  //
  // Kedua endpoint butuh sesi aktif: identitas user diambil dari JWT, bukan dari
  // body, sehingga kode hanya bisa diverifikasi untuk akun yang sedang login.

  @UseGuards(JwtAuthGuard)
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyEmailRequest,
  ): Promise<VerifyEmailResponse> {
    const parsed = verifyEmailRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throwZodBadRequest(parsed.error);
    }
    return this.authService.verifyEmail(user.id, parsed.data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResendVerificationResponse> {
    return this.authService.resendVerification(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser): Promise<MeResponse> {
    const result = await this.authService.getMe(user.id, user.sessionId);
    return meResponseSchema.parse(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponse> {
    const result = await this.authService.logout(user.id, user.sessionId);
    this.clearAuthCookies(res);
    return result;
  }

  // ---------------------------------------------------------------------------
  // Sessions (per device)
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async listSessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SessionListResponse> {
    return this.authService.listSessions(user.id, user.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.revokeSession(
      user.id,
      sessionId,
      user.sessionId,
    );

    if (result.revokedCurrent) {
      this.clearAuthCookies(res);
    }

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke-others')
  @HttpCode(HttpStatus.OK)
  async revokeOtherSessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ revoked: number }> {
    return this.authService.revokeOtherSessions(user.id, user.sessionId);
  }
}
