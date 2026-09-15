import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AccountModule } from './accounts/account.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';

/**
 * Modul fitur domain (selain auth): akun, dashboard, transaksi, dan seterusnya.
 *
 * Modul fitur lain cukup ditambahkan ke `imports` di sini.
 */
@Module({
  imports: [AuthModule, AccountModule, DashboardModule],
  exports: [AuthModule, AccountModule, DashboardModule],
})
export class FeaturesModule {}
