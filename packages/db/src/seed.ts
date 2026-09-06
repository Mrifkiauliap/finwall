import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { tenantUsers, tenants, users } from "./schema";

async function seed() {
  console.log("🌱 Starting database seeding...");

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash("admin123", salt);
  const userPassword = await bcrypt.hash("password123", salt);

  // 1. Seed Users
  const seedUsersData = [
    {
      username: "admin",
      email: "admin@finwall.dev",
      phone: "081234567890",
      password: adminPassword,
      timezone: "Asia/Jakarta",
      isActive: true,
      tenantName: "Finwall HQ Workspace",
      tenantRole: "owner" as const,
    },
    {
      username: "johndoe",
      email: "johndoe@finwall.dev",
      phone: "081298765432",
      password: userPassword,
      timezone: "Asia/Jakarta",
      isActive: true,
      tenantName: "John Doe's Workspace",
      tenantRole: "owner" as const,
    },
  ];

  for (const item of seedUsersData) {
    // Check if user already exists
    const [existing] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, item.email))
      .limit(1);

    if (existing) {
      console.log(
        `ℹ️ User "${item.username}" (${item.email}) already exists. Skipping.`,
      );
      continue;
    }

    // Insert user + tenant + tenant_users in a transaction
    await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          username: item.username,
          email: item.email,
          phone: item.phone,
          passwordHash: item.password,
          timezone: item.timezone,
          isActive: item.isActive,
        })
        .returning();

      const [newTenant] = await tx
        .insert(tenants)
        .values({
          name: item.tenantName,
        })
        .returning();

      await tx.insert(tenantUsers).values({
        tenantId: newTenant.id,
        userId: newUser.id,
        role: item.tenantRole,
      });

      console.log(
        `✅ Created user "${newUser.username}" (ID: ${newUser.id}) with workspace "${newTenant.name}" (ID: ${newTenant.id})`,
      );
    });
  }

  console.log("🎉 Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
