import getConfig from '@finwall/config/api';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from '../../core/guards/jwt.guard.js';
import { JwtStrategy } from '../../core/strategies/jwt.strategies.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { InviteController } from './invites/invite.controller.js';
import { InviteService } from './invites/invite.service.js';
import { SessionService } from './session/session.service.js';
import { TenantController } from './tenant/tenant.controller.js';
import { TenantService } from './tenant/tenant.service.js';

const config = getConfig();

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: config.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: ((config as any).JWT_ACCESS_EXPIRES_IN || '15m') as any,
      },
    }),
  ],
  controllers: [AuthController, TenantController, InviteController],
  providers: [
    AuthService,
    SessionService,
    TenantService,
    InviteService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [
    AuthService,
    SessionService,
    JwtStrategy,
    JwtAuthGuard,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
