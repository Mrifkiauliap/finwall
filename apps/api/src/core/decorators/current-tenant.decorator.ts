import type { TenantRole } from '@finwall/shared';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * Tenant yang di-resolve `TenantGuard` dari `tenantPublicId` di URL,
 * setelah keanggotaan user diverifikasi.
 */
export interface RequestTenant {
  publicId: string;
  name: string;
  role: TenantRole;
}

/**
 * Ambil tenant aktif request: `@CurrentTenant()` atau `@CurrentTenant('role')`.
 *
 * Hanya terisi bila route memakai `TenantGuard`. Nilainya berasal dari hasil
 * validasi membership di server — bukan dari klaim token.
 */
export const CurrentTenant = createParamDecorator(
  (
    data: keyof RequestTenant | undefined,
    ctx: ExecutionContext,
  ): RequestTenant | RequestTenant[keyof RequestTenant] | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant as RequestTenant | undefined;

    return data && tenant ? tenant[data] : tenant;
  },
);
