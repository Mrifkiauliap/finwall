import {
  type AuthenticatedUser,
  type DashboardResponse,
} from '@finwall/shared';
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  CurrentTenant,
  type RequestTenant,
} from '../../../core/decorators/current-tenant.decorator.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard.js';
import { TenantGuard } from '../../../core/guards/tenant.guard.js';
import { DashboardService } from './dashboard.service.js';

/**
 * Ringkasan dashboard tenant.
 *
 * ```text
 * GET /tenants/:tenantPublicId/dashboard
 * ```
 *
 * `tenantPublicId` dari URL diverifikasi keanggotaannya oleh `TenantGuard`.
 */
@Controller('tenants/:tenantPublicId/dashboard')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: RequestTenant,
  ): Promise<DashboardResponse> {
    return this.dashboardService.get(user.id, tenant.publicId);
  }
}
