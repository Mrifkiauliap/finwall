import {
  accounts,
  accountTransactions,
  and,
  asc,
  db,
  eq,
  isNull,
  sql,
  tenants,
  tenantUsers,
} from '@finwall/db';
import {
  type Account,
  type AccountListResponse,
  type AccountSummary,
  type AccountType,
  type AccountTypeSummary,
  type CreateAccountRequest,
  type UpdateAccountRequest,
  ACCOUNT_TYPES,
  accountListResponseSchema,
  createAccountRequestSchema,
  updateAccountRequestSchema,
} from '@finwall/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

const DEFAULT_CURRENCY = 'IDR';

/** Kode error PostgreSQL untuk pelanggaran unique index. */
const PG_UNIQUE_VIOLATION = '23505';

/** Row mentah tabel `accounts`. */
interface AccountRow {
  id: number;
  publicId: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Akun (aset/utang) per tenant.
 *
 * Catatan penting soal saldo:
 * `balance` TIDAK disimpan sebagai kolom. Nilainya dihitung dari
 * `initialBalance` + seluruh mutasi transaksi, sehingga tidak mungkin
 * "menyimpang" dari ledger. Untuk daftar akun, seluruh saldo dihitung dalam
 * SATU query agregasi (bukan N+1).
 */
@Injectable()
export class AccountService {
  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  /** Semua akun tenant + saldo terkini + ringkasan per jenis. */
  async list(
    userId: number,
    tenantPublicId: string,
  ): Promise<AccountListResponse> {
    const tenantId = await this.resolveTenantId(userId, tenantPublicId);

    const rows = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.tenantId, tenantId), isNull(accounts.deletedAt)))
      .orderBy(asc(accounts.name));

    const balances = await this.balanceMap(tenantId);

    const list: Account[] = rows.map((row) =>
      this.toDto(row, balances.get(row.id) ?? 0),
    );

    return accountListResponseSchema.parse({
      accounts: list,
      summary: this.buildSummary(list),
    });
  }

  // ---------------------------------------------------------------------------
  // Write
  // ---------------------------------------------------------------------------

  /** Buat akun baru. Nama harus unik per tenant (unique index di DB). */
  async create(
    userId: number,
    tenantPublicId: string,
    dto: CreateAccountRequest,
  ): Promise<Account> {
    const tenantId = await this.resolveTenantId(userId, tenantPublicId);
    const data = createAccountRequestSchema.parse(dto);

    try {
      const [created] = await db
        .insert(accounts)
        .values({
          tenantId,
          name: data.name,
          type: data.type,
          currency: (data.currency ?? DEFAULT_CURRENCY).toUpperCase(),
          initialBalance: data.initialBalance ?? 0,
        })
        .returning();

      // Akun baru belum punya transaksi, jadi saldo = saldo awal.
      return this.toDto(created, created.initialBalance);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException({
          errors: [{ path: ['name'], code: 'ACCOUNT_NAME_TAKEN' }],
        });
      }
      throw error;
    }
  }

  /** Perbarui akun. Field yang tidak dikirim tidak diubah. */
  async update(
    userId: number,
    tenantPublicId: string,
    accountPublicId: string,
    dto: UpdateAccountRequest,
  ): Promise<Account> {
    const tenantId = await this.resolveTenantId(userId, tenantPublicId);
    const data = updateAccountRequestSchema.parse(dto);

    const existing = await this.findRawOrFail(tenantId, accountPublicId);

    try {
      const [updated] = await db
        .update(accounts)
        .set({
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.currency !== undefined
            ? { currency: data.currency.toUpperCase() }
            : {}),
          ...(data.initialBalance !== undefined
            ? { initialBalance: data.initialBalance }
            : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        })
        .where(eq(accounts.id, existing.id))
        .returning();

      const balances = await this.balanceMap(tenantId);
      return this.toDto(updated, balances.get(updated.id) ?? 0);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException({
          errors: [{ path: ['name'], code: 'ACCOUNT_NAME_TAKEN' }],
        });
      }
      throw error;
    }
  }

  /**
   * Soft delete akun.
   *
   * Ditolak bila akun masih punya transaksi: `account_transactions.account_id`
   * memakai `onDelete: restrict`, dan menghapus riwayat keuangan pengguna
   * diam-diam bukan perilaku yang diinginkan.
   */
  async remove(
    userId: number,
    tenantPublicId: string,
    accountPublicId: string,
  ): Promise<{ message: string }> {
    const tenantId = await this.resolveTenantId(userId, tenantPublicId);
    const existing = await this.findRawOrFail(tenantId, accountPublicId);

    const [hasTransaction] = await db
      .select({ id: accountTransactions.id })
      .from(accountTransactions)
      .where(
        and(
          eq(accountTransactions.tenantId, tenantId),
          eq(accountTransactions.accountId, existing.id),
          isNull(accountTransactions.deletedAt),
        ),
      )
      .limit(1);

    if (hasTransaction) {
      throw new BadRequestException({
        errors: [{ path: ['publicId'], code: 'ACCOUNT_HAS_TRANSACTIONS' }],
      });
    }

    await db
      .update(accounts)
      .set({ deletedAt: new Date(), isActive: false })
      .where(eq(accounts.id, existing.id));

    return { message: 'Akun dihapus' };
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  /**
   * Resolve `tenants.id` (numerik) dari `publicId` di URL, sekaligus
   * memverifikasi keanggotaan user.
   *
   * `TenantGuard` sudah memverifikasi hal yang sama; pengulangan di sini menjaga
   * service tetap aman bila kelak dipanggil dari jalur lain (mis. job internal).
   */
  private async resolveTenantId(
    userId: number,
    tenantPublicId: string,
  ): Promise<number> {
    const [row] = await db
      .select({ id: tenants.id })
      .from(tenantUsers)
      .innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
      .where(
        and(
          eq(tenantUsers.userId, userId),
          eq(tenants.publicId, tenantPublicId),
          isNull(tenants.deletedAt),
        ),
      )
      .limit(1);

    if (!row) {
      throw new ForbiddenException('Kamu tidak punya akses ke tenant ini');
    }

    return row.id;
  }

  /** Ambil row akun mentah atau 404. */
  private async findRawOrFail(
    tenantId: number,
    accountPublicId: string,
  ): Promise<AccountRow> {
    const [row] = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          eq(accounts.publicId, accountPublicId),
          isNull(accounts.deletedAt),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException({
        errors: [{ path: ['publicId'], code: 'ACCOUNT_NOT_FOUND' }],
      });
    }

    return row as AccountRow;
  }

  /**
   * Saldo semua akun tenant dalam satu query agregasi.
   *
   * Aturan tanda:
   * - `income` / `transfer_in`  -> +amount
   * - `expense` / `transfer_out` -> -(amount + feeAmount)
   *
   * `feeAmount` mengurangi saldo, jadi ikut dihitung pada mutasi keluar.
   */
  private async balanceMap(tenantId: number): Promise<Map<number, number>> {
    const rows = await db
      .select({
        accountId: accountTransactions.accountId,
        delta: sql<number>`COALESCE(SUM(
          CASE
            WHEN ${accountTransactions.type} IN ('income', 'transfer_in')
              THEN ${accountTransactions.amount}
            WHEN ${accountTransactions.type} IN ('expense', 'transfer_out')
              THEN -(${accountTransactions.amount} + ${accountTransactions.feeAmount})
            ELSE 0
          END
        ), 0)::int`,
      })
      .from(accountTransactions)
      .where(
        and(
          eq(accountTransactions.tenantId, tenantId),
          isNull(accountTransactions.deletedAt),
        ),
      )
      .groupBy(accountTransactions.accountId);

    return new Map(rows.map((row) => [row.accountId, Number(row.delta ?? 0)]));
  }

  /** Ringkasan jumlah & total per jenis akun. */
  private buildSummary(list: Account[]): AccountSummary {
    const byType: AccountTypeSummary[] = ACCOUNT_TYPES.map((type) => {
      const items = list.filter((account) => account.type === type);
      return {
        type,
        count: items.length,
        total: items.reduce((sum, account) => sum + account.balance, 0),
      };
    }).filter((entry) => entry.count > 0);

    return {
      totalBalance: list.reduce((sum, account) => sum + account.balance, 0),
      byType,
    };
  }

  /** Row DB -> DTO. */
  private toDto(row: AccountRow, balance: number): Account {
    return {
      publicId: row.publicId,
      name: row.name,
      type: row.type,
      currency: row.currency,
      initialBalance: row.initialBalance,
      balance,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: string }).code === PG_UNIQUE_VIOLATION
    );
  }
}
