import { Algorithm, hash, verify } from "@node-rs/argon2";

/**
 * Hashing password — Argon2id.
 *
 * ===========================================================================
 * Mengapa Argon2id
 * ===========================================================================
 * Argon2id adalah rekomendasi pertama OWASP Password Storage Cheat Sheet.
 * Berbeda dari bcrypt yang hanya "CPU-hard", Argon2id **memory-hard**: biaya
 * memori membuat serangan brute-force dengan GPU/ASIC jauh lebih mahal,
 * sementara tetap cepat di server biasa.
 *
 * Kelemahan bcrypt yang hilang di sini: bcrypt **memotong password pada 72
 * byte** secara diam-diam, sehingga dua password berbeda yang 72 byte
 * pertamanya sama akan lolos verifikasi silang. Argon2id tidak punya batas ini.
 *
 * ===========================================================================
 * Catatan modul
 * ===========================================================================
 * Modul ini sengaja TIDAK diekspor dari `src/index.ts`. `@node-rs/argon2`
 * adalah modul native (Rust) yang tidak bisa di-bundle untuk browser, jadi ia
 * hanya boleh masuk lewat subpath `@finwall/shared/password` (dipakai backend
 * dan seeder). Barrel utama tetap aman untuk `apps/web`.
 */

/**
 * Parameter Argon2id.
 *
 * Nilai mengikuti setelan minimum yang direkomendasikan OWASP:
 * memori 19 MiB, 2 iterasi, paralelisme 1. Menaikkan `memoryCost`/`timeCost`
 * memperkuat hash tetapi juga menambah beban CPU per login.
 */
export const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

/** Prefix hash Argon2id, mis. `$argon2id$v=19$m=19456,t=2,p=1$...`. */
const ARGON2_PREFIX = "$argon2id$";

/** Hash password dengan Argon2id. */
export function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS);
}

/**
 * Periksa password terhadap hash Argon2id.
 *
 * Mengembalikan `false` (bukan melempar) untuk hash yang tidak dikenali —
 * termasuk sisa hash bcrypt dari sebelum migrasi — supaya data lama tidak
 * menjadi celah 500 sekaligus menandakan kredensial tidak valid.
 */
export async function verifyPassword(
  plain: string,
  storedHash: string,
): Promise<boolean> {
  if (!storedHash || !storedHash.startsWith(ARGON2_PREFIX)) return false;

  try {
    return await verify(storedHash, plain, ARGON2_OPTIONS);
  } catch {
    // Hash rusak/terpotong di database.
    return false;
  }
}

/**
 * Apakah hash sebaiknya dihitung ulang setelah login berhasil?
 *
 * `true` bila formatnya bukan Argon2id, dan juga bila parameternya sudah tidak
 * sesuai `ARGON2_OPTIONS` — jadi menaikkan `memoryCost` di masa depan otomatis
 * memigrasikan user satu per satu saat mereka login.
 */
export function passwordNeedsRehash(storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith(ARGON2_PREFIX)) return true;

  // Format: $argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>
  const params = storedHash.split("$")[3] ?? "";
  const expected = `m=${ARGON2_OPTIONS.memoryCost},t=${ARGON2_OPTIONS.timeCost},p=${ARGON2_OPTIONS.parallelism}`;

  return params !== expected;
}
