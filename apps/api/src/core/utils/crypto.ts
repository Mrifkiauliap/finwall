import { createHash, randomBytes } from 'node:crypto';

/** SHA-256 hex digest — dipakai utk hash refresh-token & kode undangan. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa O/0/I/1 agar jelas
const CODE_ALPHANUMERIC =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // tanpa O/0/I/1 agar jelas
const CODE_LENGTH = 8;
const FORGOT_PASSWORD_CODE_LENGTH = 6;
const VERIFY_EMAIL_CODE_LENGTH = 6;

/** Kode undangan pendek, mudah diketik/dibaca: format `XXXX-XXXX`. */
export function generateInviteCode(): string {
  const chars = Array.from(
    { length: CODE_LENGTH },
    () => CODE_ALPHABET[randomBytes(1)[0] % CODE_ALPHABET.length],
  );
  const body = chars.join('');
  return `${body.slice(0, 4)}-${body.slice(4)}`;
}

/** Token reset password format `XXXXXX`. */
export function generateForgotPasswordToken(): string {
  const chars = Array.from(
    { length: FORGOT_PASSWORD_CODE_LENGTH },
    () => CODE_ALPHANUMERIC[randomBytes(1)[0] % CODE_ALPHANUMERIC.length],
  );
  const body = chars.join('');
  return body;
}

/** Token verifikasi email format `XXXXXX` (dikirim lewat email). */
export function generateVerifyEmailToken(): string {
  const chars = Array.from(
    { length: VERIFY_EMAIL_CODE_LENGTH },
    () => CODE_ALPHANUMERIC[randomBytes(1)[0] % CODE_ALPHANUMERIC.length],
  );
  return chars.join('');
}

/** Normalisasi kode yang diketik user (hapus spasi/dash, uppercase). */
export function normalizeInviteCode(code: string): string {
  return code.replace(/[\s-]/g, '').toUpperCase();
}
