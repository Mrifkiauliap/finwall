import {
  type Account,
  type AccountListResponse,
  type AuthenticatedUser,
  type CreateAccountRequest,
  type UpdateAccountRequest,
  createAccountRequestSchema,
  updateAccountRequestSchema,
} from '@finwall/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentTenant,
  type RequestTenant,
} from '../../../core/decorators/current-tenant.decorator.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard.js';
import { TenantGuard } from '../../../core/guards/tenant.guard.js';
import { throwZodBadRequest } from '../../../core/utils/zod.js';
import { AccountService } from './account.service.js';

/**
 * Akun per tenant.
 *
 * Semua route tenant-scoped: `tenantPublicId` diambil dari URL dan
 * diverifikasi keanggotaannya oleh `TenantGuard` sebelum resource disentuh.
 *
 * ```text
 * GET    /tenants/:tenantPublicId/accounts
 * POST   /tenants/:tenantPublicId/accounts
 * PATCH  /tenants/:tenantPublicId/accounts/:accountPublicId
 * DELETE /tenants/:tenantPublicId/accounts/:accountPublicId
 * ```
 */
@Controller('tenants/:tenantPublicId/accounts')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: RequestTenant,
  ): Promise<AccountListResponse> {
    return this.accountService.list(user.id, tenant.publicId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: RequestTenant,
    @Body() dto: CreateAccountRequest,
  ): Promise<Account> {
    const parsed = createAccountRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throwZodBadRequest(parsed.error);
    }

    return this.accountService.create(user.id, tenant.publicId, parsed.data);
  }

  @Patch(':accountPublicId')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: RequestTenant,
    @Param('accountPublicId') accountPublicId: string,
    @Body() dto: UpdateAccountRequest,
  ): Promise<Account> {
    const parsed = updateAccountRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throwZodBadRequest(parsed.error);
    }

    return this.accountService.update(
      user.id,
      tenant.publicId,
      accountPublicId,
      parsed.data,
    );
  }

  @Delete(':accountPublicId')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: RequestTenant,
    @Param('accountPublicId') accountPublicId: string,
  ): Promise<{ message: string }> {
    return this.accountService.remove(
      user.id,
      tenant.publicId,
      accountPublicId,
    );
  }
}
