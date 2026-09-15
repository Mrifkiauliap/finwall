import { closeDb } from "./client";
import { seedInitial } from "./seed/Initial.seed";

/**
 * Titik masuk `pnpm db:seed`.
 *
 * Seluruh logika & data seed berada di `./seed/Initial.seed.ts` supaya berkas
 * ini tetap tipis dan seed lain (mis. seed demo/staging) bisa ditambahkan tanpa
 * menyentuh runner.
 */
async function seed() {
  console.log("🌱 Memulai seeding database...");

  try {
    await seedInitial();
    console.log("🎉 Seeding selesai.");
  } finally {
    // Koneksi ditutup agar proses tidak menggantung (penting untuk CI).
    await closeDb();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding gagal:", err);
    process.exit(1);
  });
