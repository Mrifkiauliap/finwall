import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module.js';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';

/**
 * Modul akun.
 *
 * Mengimpor `AuthModule` untuk mendapatkan `JwtAuthGuard` (JwtStrategy) dan
 * `SessionService` yang dibutuhkan `TenantGuard`.
 */
@Module({
  imports: [AuthModule],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
