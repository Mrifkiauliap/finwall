import type { AuthenticatedUser } from '@finwall/shared';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { RequestTenant } from '../decorators/current-tenant.decorator.js';
import { SessionService } from '../../modules/auth/session/session.service.js';

type TenantRequest = Request & {
  user?: AuthenticatedUser;
  tenant?: RequestTenant;
};

/**
 * Otorisasi tenant berbasis `tenantPublicId` dari URL.
 *
 * Wajib dipakai **setelah** `JwtAuthGuard` (butuh `request.user`).
 *
 * ```ts
 * @UseGuards(JwtAuthGuard, TenantGuard)
 * @Get('tenants/:tenantPublicId/transactions')
 * list(@CurrentTenant() tenant: RequestTenant) { ... }
 * ```
 *
 * `tenantPublicId` dari client tidak pernah dipercaya langsung: nilainya
 * di-resolve ulang + diverifikasi keanggotaannya lewat satu query
 * (`getTenantByPublicIdForUser`). Bukan anggota → 403.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Autentikasi dibutuhkan');
    }

    const raw = request.params?.tenantPublicId;
    const tenantPublicId = typeof raw === 'string' ? raw.trim() : '';
    if (!tenantPublicId) {
      throw new ForbiddenException('tenantPublicId wajib ada di URL');
    }

    // Resolve tenant + verify membership (resolver tunggal).
    const tenant = await this.sessionService.getTenantByPublicIdForUser(
      user.id,
      tenantPublicId,
    );

    if (!tenant?.publicId || !tenant.role) {
      throw new ForbiddenException('Kamu tidak punya akses ke tenant ini');
    }

    request.tenant = {
      publicId: tenant.publicId,
      name: tenant.name ?? '',
      role: tenant.role,
    };

    return true;
  }
}
