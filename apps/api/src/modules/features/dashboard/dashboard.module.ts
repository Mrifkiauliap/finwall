import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

/**
 * Modul dashboard.
 *
 * Mengimpor `AuthModule` untuk `JwtAuthGuard` (JwtStrategy) dan `SessionService`
 * yang dibutuhkan `TenantGuard`.
 */
@Module({
  imports: [AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
