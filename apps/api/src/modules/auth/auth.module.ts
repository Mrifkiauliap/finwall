import getConfig from '@finwall/config/api';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from '../../core/guards/jwt.guard.js';
import { TenantGuard } from '../../core/guards/tenant.guard.js';
import { JwtStrategy } from '../../core/strategies/jwt.strategies.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { InviteController } from './invites/invite.controller.js';
import { InviteService } from './invites/invite.service.js';
import { SessionService } from './session/session.service.js';
import { TenantResourceController } from './tenant/tenant-resource.controller.js';
import { TenantController } from './tenant/tenant.controller.js';
import { TenantService } from './tenant/tenant.service.js';
import { WorkspaceSeederService } from './tenant/workspace-seeder.service.js';
import { EmailModule } from '../email/email.module.js';

const config = getConfig();

@Module({
  imports: [
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: config.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: ((config as any).JWT_ACCESS_EXPIRES_IN || '15m') as any,
      },
    }),
  ],
  controllers: [
    AuthController,
    TenantController,
    TenantResourceController,
    InviteController,
  ],
  providers: [
    AuthService,
    SessionService,
    TenantService,
    WorkspaceSeederService,
    InviteService,
    JwtStrategy,
    JwtAuthGuard,
    TenantGuard,
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
