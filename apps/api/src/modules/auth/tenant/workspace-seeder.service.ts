import { accounts, categories, db } from '@finwall/db';
import {
  getWorkspaceTemplate,
  type WorkspaceTemplateId,
} from '@finwall/shared';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Menanam data awal (akun & kategori) untuk workspace yang baru dibuat
 * berdasarkan template yang dipilih.
 *
 * Dipisah dari `TenantService` supaya logika template bisa dipakai ulang
 * (mis. saat menerapkan template ke workspace yang sudah ada) dan supaya
 * kegagalan seeding tidak membuat endpoint create-tenant gagal total.
 */
@Injectable()
export class WorkspaceSeederService {
  private readonly logger = new Logger(WorkspaceSeederService.name);

  /**
   * Isi akun & kategori bawaan untuk `tenantId`.
   *
   * Bersifat best-effort: bila gagal, error dicatat tetapi TIDAK dilempar —
   * workspace sudah terlanjur dibuat, dan pengguna masih bisa menambah akun
   * secara manual. Ini lebih baik daripada rollback tenant yang sudah jadi.
   */
  async seed(tenantId: number, templateId: WorkspaceTemplateId): Promise<void> {
    const template = getWorkspaceTemplate(templateId);

    if (template.accounts.length === 0 && template.categories.length === 0) {
      return;
    }

    try {
      await db.transaction(async (tx) => {
        if (template.accounts.length > 0) {
          await tx.insert(accounts).values(
            template.accounts.map((account) => ({
              tenantId,
              name: account.name,
              type: account.type,
              currency: account.currency,
              initialBalance: 0,
            })),
          );
        }

        if (template.categories.length > 0) {
          await tx.insert(categories).values(
            template.categories.map((category) => ({
              tenantId,
              name: category.name,
              type: category.type,
              icon: category.icon,
              color: category.color,
            })),
          );
        }
      });
    } catch (error) {
      this.logger.error(
        `Gagal menanam data awal (template "${templateId}") untuk tenant ${tenantId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
