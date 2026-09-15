import {
  accounts,
  accountTransactions,
  and,
  asc,
  categories,
  db,
  desc,
  eq,
  gte,
  isNull,
  lt,
  sql,
  tenants,
  tenantUsers,
} from '@finwall/db';
import {
  type DashboardAccountStat,
  type DashboardCategoryStat,
  type DashboardMonth,
  type DashboardResponse,
  type DashboardTransaction,
  DASHBOARD_LIST_LIMIT,
  DASHBOARD_TREND_MONTHS,
  dashboardResponseSchema,
} from '@finwall/shared';
import { ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Ringkasan dashboard tenant.
 *
 * ATURAN ARUS KAS (penting):
 * `transfer_in`/`transfer_out` hanya memindahkan uang antar akun milik tenant
 * yang sama, jadi keduanya TIDAK dihitung sebagai pemasukan/pengeluaran.
 * Hanya `income` & `expense` yang masuk ke arus kas. Bila transfer ikut
 * dihitung, memindahkan saldo antar dompet akan tampak seperti pemasukan
 * sekaligus pengeluaran.
 *
 * Seluruh perhitungan dilakukan di database (agregasi SQL), bukan di memori,
 * supaya tetap efisien ketika jumlah transaksi bertambah.
 */
@Injectable()
export class DashboardService {
  async get(
    userId: number,
    tenantPublicId: string,
  ): Promise<DashboardResponse> {
    const tenantId = await this.resolveTenantId(userId, tenantPublicId);

    const range = this.monthRange();
    const trendMonths = this.trendMonthKeys();

    const [
      totals,
      byType,
      monthTotals,
      trendRows,
      topExpenseCategories,
      recentTransactions,
      topAccounts,
    ] = await Promise.all([
      this.netWorth(tenantId),
      this.totalsByType(tenantId),
      this.cashFlowForMonth(tenantId, range.current),
      this.trend(tenantId, trendMonths, range.trendStart),
      this.topExpenseCategories(tenantId, range.current),
      this.recentTransactions(tenantId),
      this.topAccounts(tenantId),
    ]);

    return dashboardResponseSchema.parse({
      totals: {
        netWorth: totals.netWorth,
        assets: byType.assets,
        debts: byType.debts,
        accountCount: byType.accountCount,
      },
      currentMonth: monthTotals,
      trend: this.buildTrend(trendMonths, trendRows),
      topExpenseCategories,
      recentTransactions,
      topAccounts,
    });
  }

  // ---------------------------------------------------------------------------
  // Agregasi
  // ---------------------------------------------------------------------------

  /**
   * Kekayaan bersih = total aset - total utang.
   *
   * `type` = 'other' diperlakukan sebagai utang (mis. kartu kredit / pinjaman),
   * konsisten dengan klasifikasi tampilan di frontend.
   */
  private async netWorth(tenantId: number): Promise<{ netWorth: number }> {
    const [row] = await db
      .select({
        netWorth: sql<number>`COALESCE(SUM(${this.balanceExpression()}), 0)::int`,
      })
      .from(accounts)
      .where(and(eq(accounts.tenantId, tenantId), isNull(accounts.deletedAt)));

    return { netWorth: Number(row?.netWorth ?? 0) };
  }

  /** Total saldo per klasifikasi aset/utang + jumlah akun aktif. */
  private async totalsByType(
    tenantId: number,
  ): Promise<{ assets: number; debts: number; accountCount: number }> {
    const rows = await db
      .select({
        isDebt: sql<boolean>`(${accounts.type} = 'other')`,
        total: sql<number>`COALESCE(SUM(${this.balanceExpression()}), 0)::int`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          isNull(accounts.deletedAt),
          eq(accounts.isActive, true),
        ),
      )
      .groupBy(sql`(${accounts.type} = 'other')`);

    let assets = 0;
    let debts = 0;
    let accountCount = 0;

    for (const row of rows) {
      accountCount += Number(row.count ?? 0);
      if (row.isDebt) debts += Number(row.total ?? 0);
      else assets += Number(row.total ?? 0);
    }

    return { assets, debts, accountCount };
  }

  /** Arus kas satu bulan (tanpa transfer internal). */
  private async cashFlowForMonth(
    tenantId: number,
    range: { start: Date; end: Date; key: string },
  ): Promise<DashboardMonth> {
    const income = await this.sumByType(tenantId, 'income', range);
    const expense = await this.sumByType(tenantId, 'expense', range);

    return { month: range.key, income, expense, net: income - expense };
  }

  /** Total satu jenis transaksi dalam rentang tanggal. */
  private async sumByType(
    tenantId: number,
    type: 'income' | 'expense',
    range: { start: Date; end: Date },
  ): Promise<number> {
    const [row] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${accountTransactions.amount} + ${accountTransactions.feeAmount}), 0)::int`,
      })
      .from(accountTransactions)
      .where(
        and(
          eq(accountTransactions.tenantId, tenantId),
          eq(accountTransactions.type, type),
          isNull(accountTransactions.deletedAt),
          gte(accountTransactions.transactionAt, range.start),
          lt(accountTransactions.transactionAt, range.end),
        ),
      );

    return Number(row?.total ?? 0);
  }

  /** Arus kas per bulan untuk beberapa bulan terakhir. */
  private async trend(
    tenantId: number,
    monthKeys: string[],
    start: Date,
  ): Promise<{ month: string; income: number; expense: number }[]> {
    const rows = await db
      .select({
        // `date_trunc` memberi label bulan yang stabil, bukan bergantung zona
        // waktu Node saat memformat tanggal.
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${accountTransactions.transactionAt}), 'YYYY-MM')`,
        income: sql<number>`COALESCE(SUM(CASE WHEN ${accountTransactions.type} = 'income' THEN ${accountTransactions.amount} + ${accountTransactions.feeAmount} ELSE 0 END), 0)::int`,
        expense: sql<number>`COALESCE(SUM(CASE WHEN ${accountTransactions.type} = 'expense' THEN ${accountTransactions.amount} + ${accountTransactions.feeAmount} ELSE 0 END), 0)::int`,
      })
      .from(accountTransactions)
      .where(
        and(
          eq(accountTransactions.tenantId, tenantId),
          isNull(accountTransactions.deletedAt),
          // Transfer internal dikecualikan dari arus kas.
          sql`${accountTransactions.type} IN ('income', 'expense')`,
          gte(accountTransactions.transactionAt, start),
        ),
      )
      .groupBy(sql`DATE_TRUNC('month', ${accountTransactions.transactionAt})`)
      .orderBy(
        asc(sql`DATE_TRUNC('month', ${accountTransactions.transactionAt})`),
      );

    void monthKeys;

    return rows.map((row) => ({
      month: row.month,
      income: Number(row.income ?? 0),
      expense: Number(row.expense ?? 0),
    }));
  }

  /**
   * Lengkapi tren: bulan tanpa transaksi tetap muncul dengan nilai 0.
   *
   * Query agregasi hanya mengembalikan bulan yang ADA datanya; tanpa langkah
   * ini grafik akan "bolong" dan sumbu waktu jadi menyesatkan.
   */
  private buildTrend(
    monthKeys: string[],
    rows: { month: string; income: number; expense: number }[],
  ): DashboardMonth[] {
    const byMonth = new Map(rows.map((row) => [row.month, row]));

    return monthKeys.map((month) => {
      const row = byMonth.get(month);
      const income = row?.income ?? 0;
      const expense = row?.expense ?? 0;
      return { month, income, expense, net: income - expense };
    });
  }

  /** Kategori pengeluaran terbesar bulan berjalan. */
  private async topExpenseCategories(
    tenantId: number,
    range: { start: Date; end: Date },
  ): Promise<DashboardCategoryStat[]> {
    const rows = await db
      .select({
        publicId: categories.publicId,
        name: categories.name,
        icon: categories.icon,
        color: categories.color,
        total: sql<number>`COALESCE(SUM(${accountTransactions.amount} + ${accountTransactions.feeAmount}), 0)::int`,
      })
      .from(accountTransactions)
      .leftJoin(categories, eq(accountTransactions.categoryId, categories.id))
      .where(
        and(
          eq(accountTransactions.tenantId, tenantId),
          eq(accountTransactions.type, 'expense'),
          isNull(accountTransactions.deletedAt),
          gte(accountTransactions.transactionAt, range.start),
          lt(accountTransactions.transactionAt, range.end),
        ),
      )
      .groupBy(
        categories.publicId,
        categories.name,
        categories.icon,
        categories.color,
      )
      .orderBy(
        desc(
          sql`COALESCE(SUM(${accountTransactions.amount} + ${accountTransactions.feeAmount}), 0)`,
        ),
      )
      .limit(DASHBOARD_LIST_LIMIT);

    return rows.map((row) => ({
      publicId: row.publicId ?? null,
      // Transaksi tanpa kategori dikelompokkan sebagai "Tanpa kategori" di UI
      // (nama kosong -> frontend memakai fallback i18n).
      name: row.name ?? '',
      icon: row.icon ?? null,
      color: row.color ?? null,
      total: Number(row.total ?? 0),
    }));
  }

  /** Transaksi terbaru lintas akun. */
  private async recentTransactions(
    tenantId: number,
  ): Promise<DashboardTransaction[]> {
    const rows = await db
      .select({
        publicId: accountTransactions.publicId,
        type: accountTransactions.type,
        amount: accountTransactions.amount,
        description: accountTransactions.description,
        transactionAt: accountTransactions.transactionAt,
        accountName: accounts.name,
        categoryName: categories.name,
        categoryIcon: categories.icon,
      })
      .from(accountTransactions)
      .innerJoin(accounts, eq(accountTransactions.accountId, accounts.id))
      .leftJoin(categories, eq(accountTransactions.categoryId, categories.id))
      .where(
        and(
          eq(accountTransactions.tenantId, tenantId),
          isNull(accountTransactions.deletedAt),
        ),
      )
      .orderBy(desc(accountTransactions.transactionAt))
      .limit(DASHBOARD_LIST_LIMIT);

    return rows.map((row) => ({
      publicId: row.publicId,
      type: row.type,
      amount: row.amount,
      description: row.description ?? null,
      transactionAt: row.transactionAt.toISOString(),
      accountName: row.accountName,
      categoryName: row.categoryName ?? null,
      categoryIcon: row.categoryIcon ?? null,
    }));
  }

  /** Akun dengan saldo terbesar. */
  private async topAccounts(tenantId: number): Promise<DashboardAccountStat[]> {
    const rows = await db
      .select({
        publicId: accounts.publicId,
        name: accounts.name,
        type: accounts.type,
        currency: accounts.currency,
        balance: sql<number>`${this.balanceExpression()}::int`,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          isNull(accounts.deletedAt),
          eq(accounts.isActive, true),
        ),
      )
      .orderBy(desc(sql`${this.balanceExpression()}`))
      .limit(DASHBOARD_LIST_LIMIT);

    return rows.map((row) => ({
      publicId: row.publicId,
      name: row.name,
      type: row.type,
      currency: row.currency,
      balance: Number(row.balance ?? 0),
    }));
  }

  // ---------------------------------------------------------------------------
  // Helper
  // ---------------------------------------------------------------------------

  /**
   * Ekspresi SQL saldo akun: saldo awal + seluruh mutasi.
   *
   * Dipakai sebagai subquery korelasi agar konsisten dengan perhitungan di
   * `AccountService` (satu sumber aturan tanda).
   */
  private balanceExpression() {
    return sql`(
      ${accounts.initialBalance} + COALESCE((
        SELECT SUM(
          CASE
            WHEN ${accountTransactions.type} IN ('income', 'transfer_in')
              THEN ${accountTransactions.amount}
            WHEN ${accountTransactions.type} IN ('expense', 'transfer_out')
              THEN -(${accountTransactions.amount} + ${accountTransactions.feeAmount})
            ELSE 0
          END
        )
        FROM ${accountTransactions}
        WHERE ${accountTransactions.accountId} = ${accounts.id}
          AND ${accountTransactions.deletedAt} IS NULL
      ), 0)
    )`;
  }

  /** Rentang tanggal bulan berjalan + awal rentang tren. */
  private monthRange(): {
    current: { start: Date; end: Date; key: string };
    trendStart: Date;
  } {
    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const trendStart = new Date(start);
    trendStart.setUTCMonth(
      trendStart.getUTCMonth() - (DASHBOARD_TREND_MONTHS - 1),
    );

    return {
      current: { start, end, key: this.monthKey(start) },
      trendStart,
    };
  }

  /** Kunci bulan `YYYY-MM` berurutan untuk tren (termasuk bulan berjalan). */
  private trendMonthKeys(): string[] {
    const now = new Date();
    const keys: string[] = [];

    for (let offset = DASHBOARD_TREND_MONTHS - 1; offset >= 0; offset -= 1) {
      const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
      );
      keys.push(this.monthKey(date));
    }

    return keys;
  }

  private monthKey(date: Date): string {
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${date.getUTCFullYear()}-${month}`;
  }

  /** Resolve `tenants.id` dari `publicId` + verifikasi keanggotaan user. */
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
}
