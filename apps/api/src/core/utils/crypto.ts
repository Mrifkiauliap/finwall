import { createHash, randomBytes } from 'node:crypto';

/** SHA-256 hex digest — dipakai utk hash refresh-token & kode undangan. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa O/0/I/1 agar jelas
const CODE_LENGTH = 8;

/** Kode undangan pendek, mudah diketik/dibaca: format `XXXX-XXXX`. */
export function generateInviteCode(): string {
  const chars = Array.from(
    { length: CODE_LENGTH },
    () => CODE_ALPHABET[randomBytes(1)[0] % CODE_ALPHABET.length],
  );
  const body = chars.join('');
  return `${body.slice(0, 4)}-${body.slice(4)}`;
}

/** Normalisasi kode yang diketik user (hapus spasi/dash, uppercase). */
export function normalizeInviteCode(code: string): string {
  return code.replace(/[\s-]/g, '').toUpperCase();
}
