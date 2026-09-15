/**
 * Template email transactional multi-bahasa (reset password & verifikasi email).
 *
 * Bahasa yang didukung: `id` (Bahasa Indonesia) dan `en` (English).
 * Default bahasa: `id`.
 *
 * ===========================================================================
 * Kenapa tabel, bukan flexbox/CSS modern?
 * ===========================================================================
 * Email client (terutama Outlook & Gmail web) tidak mendukung flexbox/grid atau
 * `var()`. Karena itu tata letak memakai pola klasik: `<table>` bersarang dengan
 * atribut `width`/`align` dan CSS inline. Layout ini juga otomatis responsif
 * karena `width="100%"` pada tabel luar + `max-width` pada kartu.
 *
 * ===========================================================================
 * Konsistensi dengan aplikasi web
 * ===========================================================================
 * Nilai warna/font/radius diambil dari design token `apps/web/src/assets/main.css`
 * (mode terang) agar email terasa satu produk dengan aplikasinya:
 *
 *   web token                       | nilai email
 *   --------------------------------|----------------------------------------
 *   --primary  oklch(0.55 .13 168)  | #17977e (teal brand)
 *   --background oklch(.99 .003 160)| #fbfcfb (off-white hangat)
 *   --card      #fff                | #ffffff
 *   --foreground oklch(.18 .01 180) | #1b2426
 *   --muted-foreground .52 .02 175  | #68797a
 *   --border    oklch(.91 .008 168) | #e2e7e6
 *   --radius    0.625rem            | 12-16px pada kartu
 *
 * Catatan: CSS custom property (`var(--primary)`) TIDAK dipakai karena email
 * client tidak mendukungnya — nilainya ditulis sebagai hex literal, dan
 * komentarnya sengaja menyebut token sumbernya agar mudah disinkronkan.
 */

export type EmailLocale = 'id' | 'en';

// ---------------------------------------------------------------------------
// Design token (hex, disalin dari main.css)
// ---------------------------------------------------------------------------

const TOKENS = {
  /** --primary — teal brand Finwall. */
  primary: '#17977e',
  primaryDark: '#0f7f69',
  /** --primary-foreground — teks di atas warna brand. */
  onPrimary: '#f2fbf9',
  /** Latar sangat lembut untuk kotak kode/panggilan. */
  primarySoft: '#e9f6f2',
  /** Garis putus-putus kotak kode. */
  primaryBorder: '#a9ded0',

  /** --background — off-white hangat (bukan putih menyilaukan). */
  background: '#fbfcfb',
  card: '#ffffff',
  /** --foreground. */
  foreground: '#1b2426',
  /** --muted-foreground. */
  mutedForeground: '#68797a',
  /** --muted — latar blok kode pada versi teks. */
  muted: '#f4f7f6',
  /** --border. */
  border: '#e2e7e6',

  /** --warning — dipakai header reset password agar beda dari verifikasi. */
  warning: '#b8801f',
  warningSoft: '#fdf6e8',
  warningBorder: '#eccf95',

  /** --success/--income — dipakai header verifikasi email. */
  success: '#2a9d5c',

  /** --font-sans / --font-mono dari @theme. */
  fontSans:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

// ---------------------------------------------------------------------------
// Terjemahan
// ---------------------------------------------------------------------------

interface MailStrings {
  subject: string;
  /** Judul di dalam kartu (bukan sapaan). */
  heading: string;
  greeting: (name?: string) => string;
  intro: string;
  codeLabel: string;
  expiry: string;
  disclaimer: string;
  /** Kalimat kecil di atas kotak kode, memberi tahu kode ini untuk apa. */
  codeHint: string;
  /** Judul versi teks biasa. */
  footer: string;
}

const FORGOT_PASSWORD_STRINGS: Record<EmailLocale, MailStrings> = {
  id: {
    subject: 'Reset Password — Finwall',
    heading: 'Reset Password',
    greeting: () => 'Halo,',
    intro:
      'Kami menerima permintaan untuk mengatur ulang password akun Anda. Masukkan kode di bawah ini pada halaman reset password.',
    codeLabel: 'Kode Reset Password',
    codeHint: 'Masukkan kode ini di halaman reset password',
    expiry: 'Kode ini berlaku selama 15 menit.',
    disclaimer:
      'Jika Anda tidak meminta reset password, abaikan saja email ini — akun Anda tetap aman dan password tidak berubah.',
    footer: 'Email otomatis dari Finwall',
  },
  en: {
    subject: 'Password Reset — Finwall',
    heading: 'Password Reset',
    greeting: () => 'Hello,',
    intro:
      'We received a request to reset the password for your account. Enter the code below on the password reset page.',
    codeLabel: 'Password Reset Code',
    codeHint: 'Enter this code on the reset password page',
    expiry: 'This code is valid for 15 minutes.',
    disclaimer:
      "If you didn't request a password reset, you can safely ignore this email — your account stays secure and your password is unchanged.",
    footer: 'Automated email from Finwall',
  },
};

const VERIFY_EMAIL_STRINGS: Record<EmailLocale, MailStrings> = {
  id: {
    subject: 'Verifikasi Email — Finwall',
    heading: 'Verifikasi Email',
    greeting: (username) => `Selamat datang di Finwall, ${username}!`,
    intro:
      'Satu langkah lagi: verifikasi alamat email Anda agar akun aktif sepenuhnya dan Anda bisa memakai semua fitur Finwall.',
    codeLabel: 'Kode Verifikasi',
    codeHint: 'Masukkan kode ini di halaman verifikasi email',
    expiry: 'Kode ini berlaku selama 30 menit.',
    disclaimer:
      'Jika Anda tidak pernah mendaftar di Finwall, abaikan email ini dan tidak ada yang perlu Anda lakukan.',
    footer: 'Email otomatis dari Finwall',
  },
  en: {
    subject: 'Email Verification — Finwall',
    heading: 'Email Verification',
    greeting: (username) => `Welcome to Finwall, ${username}!`,
    intro:
      'One step left: verify your email address so your account becomes fully active and you can use every Finwall feature.',
    codeLabel: 'Verification Code',
    codeHint: 'Enter this code on the email verification page',
    expiry: 'This code is valid for 30 minutes.',
    disclaimer:
      "If you didn't sign up for Finwall, just ignore this email — there's nothing you need to do.",
    footer: 'Automated email from Finwall',
  },
};

/** Baris kecil "kenapa saya menerima email ini" pada versi teks biasa. */
const TEXT_FOOTER_STRINGS: Record<EmailLocale, string> = {
  id: 'Ini adalah email otomatis, mohon tidak membalas email ini.',
  en: 'This is an automated email, please do not reply.',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function year(): string {
  return String(new Date().getFullYear());
}

/**
 * Tampilkan kode sebagai SATU text node, dengan jarak antar karakter dari
 * `letter-spacing` + `padding-left`.
 *
 * Penting: kode TIDAK dipecah menjadi satu sel/elemen per karakter. Versi
 * sebelumnya memakai satu `<td>` per karakter, dan hasilnya saat disalin user
 * adalah `O	m	Z	8	Z	k` — tab/spasi antar sel ikut tercopy sehingga kode
 * tidak valid. Dengan satu text node, `Ctrl+C` menghasilkan `OmZ8Zk` persis.
 *
 * `letter-spacing` memberi jarak visual TANPA ikut tercopy (berbeda dari
 * menyisipkan `&nbsp;` di antara karakter), dan `text-indent:32px` +
 * `padding-left:32px` menyeimbangkan ruang ekstra yang ditambahkan
 * `letter-spacing` pada sisi kanan sehingga kode tetap center secara optis.
 *
 * `white-space:nowrap` menjaga kode tetap satu baris, dan `word-break:break-all`
 * sebagai jaring pengaman bila font besar dipaksa oleh klien email.
 */
function codeBlock(token: string): string {
  return `<span
                    style="display:inline-block;white-space:nowrap;word-break:break-all;font-family:${TOKENS.fontMono};font-size:30px;line-height:1.35;font-weight:700;color:${TOKENS.primaryDark};letter-spacing:8px;text-indent:8px;padding-left:8px;"
                  >${token}</span>`;
}

interface LayoutOptions {
  locale: EmailLocale;
  /**
   * Warna header. Verifikasi email memakai hijau (makna "selamat datang"),
   * reset password memakai amber (perhatian: aksi sensitif).
   */
  accent: 'success' | 'warning';
  heading: string;
  greeting: string;
  intro: string;
  codeLabel: string;
  codeHint: string;
  token: string;
  expiry: string;
  disclaimer: string;
}

/**
 * Kerangka HTML bersama untuk semua email.
 *
 * Satu tempat untuk header, kotak kode, dan footer — sehingga menambah jenis
 * email baru cukup menyuplai teksnya, bukan menyalin 60 baris markup.
 */
function renderLayout(options: LayoutOptions): string {
  const { locale } = options;

  const accent = {
    success: {
      base: TOKENS.success,
      soft: TOKENS.primarySoft,
      border: TOKENS.primaryBorder,
    },
    warning: {
      base: TOKENS.warning,
      soft: TOKENS.warningSoft,
      border: TOKENS.warningBorder,
    },
  }[options.accent];

  const tagline =
    locale === 'id'
      ? 'Manajemen keuangan cerdas'
      : 'Smart financial management';

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <!-- Outlook memaksa rendering berbasis Word; meta ini menonaktifkannya. -->
  <meta name="x-apple-disable-message-reformatting">
  <title>${options.codeLabel}</title>
</head>
<body style="margin:0;padding:0;background:${TOKENS.background};-webkit-font-smoothing:antialiased;">

  <!-- Preheader: teks yang muncul di preview inbox, disembunyikan di body. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${options.codeHint} — ${options.expiry}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:${TOKENS.background};padding:32px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:560px;background:${TOKENS.card};border:1px solid ${TOKENS.border};border-radius:16px;overflow:hidden;">

          <!-- Header: aksen tipis + wordmark (bukan blok warna penuh agar
               selaras dengan header aplikasi yang bersih). -->
          <tr>
            <td style="height:6px;background:${accent.base};line-height:6px;font-size:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:${TOKENS.fontSans};font-size:18px;font-weight:700;color:${TOKENS.primary};letter-spacing:-0.2px;">
                    Finwall
                  </td>
                  <td align="right" style="font-family:${TOKENS.fontSans};font-size:12px;color:${TOKENS.mutedForeground};">
                    ${tagline}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Isi -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <h1 style="margin:0 0 16px;font-family:${TOKENS.fontSans};font-size:22px;line-height:1.3;font-weight:700;color:${TOKENS.foreground};letter-spacing:-0.3px;">
                ${options.heading}
              </h1>

              <p style="margin:0 0 6px;font-family:${TOKENS.fontSans};font-size:15px;font-weight:600;color:${TOKENS.foreground};">
                ${options.greeting}
              </p>
              <p style="margin:0 0 24px;font-family:${TOKENS.fontSans};font-size:14px;line-height:1.65;color:${TOKENS.mutedForeground};">
                ${options.intro}
              </p>
            </td>
          </tr>

          <!-- Kotak kode -->
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:${accent.soft};border:1px dashed ${accent.border};border-radius:12px;">
                <tr>
                  <td align="center" style="padding:20px 16px 6px;font-family:${TOKENS.fontSans};font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:${TOKENS.mutedForeground};">
                    ${options.codeLabel}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 16px 20px;">
                    <!-- Satu text node: aman saat kode disalin user. -->
                    ${codeBlock(options.token)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px 0;font-family:${TOKENS.fontSans};font-size:13px;font-weight:600;color:${TOKENS.foreground};">
              ${options.expiry}
            </td>
          </tr>
          <tr>
            <td style="padding:6px 32px 28px;font-family:${TOKENS.fontSans};font-size:12px;line-height:1.7;color:${TOKENS.mutedForeground};">
              ${options.disclaimer}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:${TOKENS.muted};border-top:1px solid ${TOKENS.border};">
              <p style="margin:0;font-family:${TOKENS.fontSans};font-size:11px;line-height:1.8;color:${TOKENS.mutedForeground};">
                ${options.codeHint}.<br>
                © ${year()} Finwall · ${TEXT_FOOTER_STRINGS[locale]}
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Versi teks biasa (fallback).
 *
 * Ditulis manual, bukan hasil `strip` dari HTML: menghapus tag HTML menyisakan
 * seluruh isi atribut `style` dan menghasilkan teks yang berantakan. Banyak
 * klien email (dan filter spam) justru lebih memercayai bagian `text/plain`.
 */
function renderText(options: {
  heading: string;
  greeting: string;
  intro: string;
  codeLabel: string;
  token: string;
  expiry: string;
  disclaimer: string;
  locale: EmailLocale;
}): string {
  return [
    'Finwall',
    '='.repeat(48),
    '',
    options.heading,
    '',
    options.greeting,
    '',
    options.intro,
    '',
    `${options.codeLabel}:`,
    '',
    `    ${options.token}`,
    '',
    options.expiry,
    '',
    '-'.repeat(48),
    options.disclaimer,
    '',
    TEXT_FOOTER_STRINGS[options.locale],
    `© ${year()} Finwall`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Reset Password
// ---------------------------------------------------------------------------

/**
 * Bangun email reset password.
 * @param token  Kode 6 karakter yang dikirim ke pengguna
 * @param locale Bahasa email, default `'id'`
 */
export function buildForgotPasswordEmail(
  token: string,
  locale: EmailLocale = 'id',
): { subject: string; html: string; text: string } {
  const s = FORGOT_PASSWORD_STRINGS[locale];

  const heading = s.heading;
  const greeting = s.greeting();
  const intro = s.intro;

  const html = renderLayout({
    locale,
    // Amber: aksi sensitif yang mengubah kredensial.
    accent: 'warning',
    heading,
    greeting,
    intro,
    codeLabel: s.codeLabel,
    codeHint: s.codeHint,
    token,
    expiry: s.expiry,
    disclaimer: s.disclaimer,
  });

  return {
    subject: s.subject,
    html,
    text: renderText({
      heading,
      greeting,
      intro,
      codeLabel: s.codeLabel,
      token,
      expiry: s.expiry,
      disclaimer: s.disclaimer,
      locale,
    }),
  };
}

// ---------------------------------------------------------------------------
// Verifikasi Email
// ---------------------------------------------------------------------------

/**
 * Bangun email verifikasi email.
 * @param token    Kode 6 karakter yang dikirim ke pengguna
 * @param username Nama pengguna untuk sapaan
 * @param locale   Bahasa email, default `'id'`
 */
export function buildVerifyEmailTemplate(
  token: string,
  username: string,
  locale: EmailLocale = 'id',
): { subject: string; html: string; text: string } {
  const s = VERIFY_EMAIL_STRINGS[locale];

  const heading = s.heading;
  const greeting = s.greeting(username);
  const intro = s.intro;

  const html = renderLayout({
    locale,
    // Hijau: onboarding/penerimaan, bukan peringatan.
    accent: 'success',
    heading,
    greeting,
    intro,
    codeLabel: s.codeLabel,
    codeHint: s.codeHint,
    token,
    expiry: s.expiry,
    disclaimer: s.disclaimer,
  });

  return {
    subject: s.subject,
    html,
    text: renderText({
      heading,
      greeting,
      intro,
      codeLabel: s.codeLabel,
      token,
      expiry: s.expiry,
      disclaimer: s.disclaimer,
      locale,
    }),
  };
}
