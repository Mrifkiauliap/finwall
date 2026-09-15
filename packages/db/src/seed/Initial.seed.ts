import {
  getWorkspaceTemplate,
  type WorkspaceTemplateId,
} from "@finwall/shared";
import { hashPassword } from "@finwall/shared/password";
import { eq } from "drizzle-orm";
import { db } from "../client";
import {
  accountTransactions,
  accounts,
  categories,
  tenantUsers,
  tenants,
  users,
} from "../schema";

/**
 * Data seed awal untuk pengembangan.
 *
 * Setiap user contoh dibuat dengan TEMPLATE workspace yang berbeda, sehingga
 * seluruh jalur UI bisa diuji tanpa menyiapkan data manual:
 *
 * | user              | template   | kegunaan                                   |
 * |-------------------|------------|--------------------------------------------|
 * | admin@finwall.dev | business   | pembukuan usaha (akun & kategori bisnis)   |
 * | johndoe@finwall.dev | individual | keuangan pribadi + contoh transaksi      |
 * | family@finwall.dev | family    | keuangan rumah tangga                      |
 * | blank@finwall.dev | blank      | menguji empty state (tanpa akun/kategori)  |
 *
 * Akun & kategori diambil dari `@finwall/shared` — sumber yang SAMA dengan yang
 * dipakai backend saat pembuatan workspace, jadi data seed tidak pernah
 * menyimpang dari template produksi.
 */

export interface SeedUserDefinition {
  username: string;
  email: string;
  phone: string;
  password: string;
  timezone: string;
  tenantName: string;
  template: WorkspaceTemplateId;
}

export const SEED_PASSWORD = {
  admin: "admin123",
  user: "password123",
} as const;

export const SEED_USERS: SeedUserDefinition[] = [
  {
    username: "admin",
    email: "admin@finwall.dev",
    phone: "081234567890",
    password: SEED_PASSWORD.admin,
    timezone: "Asia/Jakarta",
    tenantName: "Finwall HQ Workspace",
    template: "business",
  },
  {
    username: "johndoe",
    email: "johndoe@finwall.dev",
    phone: "081298765432",
    password: SEED_PASSWORD.user,
    timezone: "Asia/Jakarta",
    tenantName: "John Doe's Workspace",
    template: "individual",
  },
  {
    username: "family",
    email: "family@finwall.dev",
    phone: "081277665544",
    password: SEED_PASSWORD.user,
    timezone: "Asia/Jakarta",
    tenantName: "Keluarga Santoso",
    template: "family",
  },
  {
    username: "blank",
    email: "blank@finwall.dev",
    phone: "081255443322",
    password: SEED_PASSWORD.user,
    timezone: "Asia/Jakarta",
    tenantName: "Workspace Kosong",
    // Sengaja kosong untuk menguji empty state di UI.
    template: "blank",
  },
];

/** Tipe transaksi DB -> tidak perlu impor enum, cukup literal. */
type TxType = "income" | "expense" | "transfer_in" | "transfer_out";

interface SeedTransaction {
  /** Nama kategori; harus ada di template yang dipakai. */
  category: string;
  /** Nama akun penampung. */
  account: string;
  type: TxType;
  amount: number;
  description: string;
  /** Selisih hari dari hari ini (negatif = lampau). */
  daysAgo: number;
}

/**
 * Contoh transaksi untuk user `johndoe` (template individual).
 *
 * Hanya dibuat bila kategori & akun yang dirujuk benar-benar ada, sehingga
 * aman bila definisi template berubah.
 */
const SAMPLE_TRANSACTIONS: SeedTransaction[] = [
  {
    category: "Gaji",
    account: "Rekening Bank",
    type: "income",
    amount: 12_500_000,
    description: "Gaji bulan ini",
    daysAgo: 25,
  },
  {
    category: "Makanan & Minuman",
    account: "E-Wallet",
    type: "expense",
    amount: 185_000,
    description: "Makan siang tim",
    daysAgo: 20,
  },
  {
    category: "Transportasi",
    account: "Dompet Tunai",
    type: "expense",
    amount: 72_500,
    description: "Ongkos harian",
    daysAgo: 18,
  },
  {
    category: "Tagihan & Utilitas",
    account: "Rekening Bank",
    type: "expense",
    amount: 540_000,
    description: "Listrik & air",
    daysAgo: 15,
  },
  {
    category: "Belanja",
    account: "E-Wallet",
    type: "expense",
    amount: 320_000,
    description: "Belanja bulanan",
    daysAgo: 12,
  },
  {
    category: "Hiburan",
    account: "E-Wallet",
    type: "expense",
    amount: 150_000,
    description: "Langganan streaming",
    daysAgo: 9,
  },
  {
    category: "Bunga & Dividen",
    account: "Investasi",
    type: "income",
    amount: 95_000,
    description: "Dividen reksa dana",
    daysAgo: 6,
  },
  {
    category: "Kesehatan",
    account: "Dompet Tunai",
    type: "expense",
    amount: 260_000,
    description: "Vitamin & obat",
    daysAgo: 3,
  },
];

/** Ubah `daysAgo` menjadi tanggal. */
function dateFromDaysAgo(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/** Tipe transaksi database untuk klien Drizzle di dalam `db.transaction`. */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Tanam akun & kategori untuk sebuah tenant dari template terpilih.
 * Mengembalikan peta nama -> id agar bisa dipakai membuat transaksi contoh.
 */
async function seedWorkspaceData(
  tx: Tx,
  tenantId: number,
  templateId: WorkspaceTemplateId,
): Promise<{
  accountIds: Map<string, number>;
  categoryIds: Map<string, number>;
}> {
  const template = getWorkspaceTemplate(templateId);
  const accountIds = new Map<string, number>();
  const categoryIds = new Map<string, number>();

  if (template.accounts.length > 0) {
    const insertedAccounts = await tx
      .insert(accounts)
      .values(
        template.accounts.map((account) => ({
          tenantId,
          name: account.name,
          type: account.type,
          currency: account.currency,
          initialBalance: 0,
        })),
      )
      .returning({ id: accounts.id, name: accounts.name });

    for (const row of insertedAccounts) {
      accountIds.set(row.name, row.id);
    }
  }

  if (template.categories.length > 0) {
    const insertedCategories = await tx
      .insert(categories)
      .values(
        template.categories.map((category) => ({
          tenantId,
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
        })),
      )
      .returning({ id: categories.id, name: categories.name });

    for (const row of insertedCategories) {
      categoryIds.set(row.name, row.id);
    }
  }

  return { accountIds, categoryIds };
}

/** Buat transaksi contoh (hanya bila akun & kategori yang dirujuk tersedia). */
async function seedSampleTransactions(
  tx: Tx,
  tenantId: number,
  accountIds: Map<string, number>,
  categoryIds: Map<string, number>,
): Promise<number> {
  const rows = SAMPLE_TRANSACTIONS.flatMap((sample) => {
    const accountId = accountIds.get(sample.account);
    const categoryId = categoryIds.get(sample.category);

    // Lewati bila template tidak menyediakan akun/kategori yang dirujuk.
    if (!accountId || !categoryId) return [];

    return [
      {
        tenantId,
        accountId,
        categoryId,
        type: sample.type,
        description: sample.description,
        amount: sample.amount,
        feeAmount: 0,
        status: "completed" as const,
        transactionAt: dateFromDaysAgo(sample.daysAgo),
      },
    ];
  });

  if (rows.length === 0) return 0;

  await tx.insert(accountTransactions).values(rows);
  return rows.length;
}

/**
 * Jalankan seed awal.
 *
 * Idempoten: user yang emailnya sudah ada akan dilewati, sehingga aman
 * dijalankan berulang kali.
 */
export async function seedInitial(): Promise<void> {
  for (const item of SEED_USERS) {
    const [existing] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, item.email))
      .limit(1);

    if (existing) {
      console.log(
        `ℹ️  User "${item.username}" (${item.email}) sudah ada — dilewati.`,
      );
      continue;
    }

    // Hash memakai Argon2id — fungsi yang SAMA dengan alur signup, sehingga
    // user seed dan user asli selalu memakai format hash yang identik.
    const passwordHash = await hashPassword(item.password);

    await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          username: item.username,
          email: item.email,
          phone: item.phone,
          passwordHash,
          timezone: item.timezone,
          isActive: true,
          isVerified: true,
          emailVerifiedAt: new Date(),
        })
        .returning();

      const [newTenant] = await tx
        .insert(tenants)
        .values({ name: item.tenantName })
        .returning();

      await tx.insert(tenantUsers).values({
        tenantId: newTenant.id,
        userId: newUser.id,
        role: "owner",
      });

      const { accountIds, categoryIds } = await seedWorkspaceData(
        tx,
        newTenant.id,
        item.template,
      );

      // Transaksi contoh hanya untuk template individual agar daftar transaksi
      // dan dashboard punya data nyata saat diuji.
      const txCount =
        item.template === "individual"
          ? await seedSampleTransactions(
              tx,
              newTenant.id,
              accountIds,
              categoryIds,
            )
          : 0;

      console.log(
        `✅ ${newUser.username} → workspace "${newTenant.name}" ` +
          `(template: ${item.template}, ${accountIds.size} akun, ` +
          `${categoryIds.size} kategori, ${txCount} transaksi)`,
      );
    });
  }
}
