import getConfig from '@finwall/config/api';
import { Injectable, Logger } from '@nestjs/common';
import type { SendEmailOptions } from './email.types.js';
import { baseProvider } from './provider/base.provider.js';
import { resendProvider } from './provider/resend.provider.js';
import { sumopodProvider } from './provider/sumopod.provider.js';
import type { EmailLocale } from './template-email.js';

const config = getConfig();

/**
 * EmailService — lapisan tipis di atas provider email.
 *
 * Pemilihan provider (`RESEND_API_KEY` menang atas SMTP):
 * 1. `RESEND_API_KEY` terisi → `resendProvider` (HTTP API, deliverability
 *    transaksional paling baik). Pakai ini di production.
 * 2. `EMAIL_HOST === 'smtp.sumopod.com'` → `sumopodProvider` (465/TLS).
 * 3. lainnya → `baseProvider` (EMAIL_HOST/PORT/SECURE dari env).
 *
 * `EMAIL_PASSWORD` tetap wajib di schema env, jadi mode Resend pun butuh nilai
 * (boleh dummy) selama SMTP tidak dipakai.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /** Alamat pengirim: `EMAIL_FROM` bila diisi, kalau tidak `EMAIL_USER`. */
  private get from(): string {
    return config.EMAIL_FROM || config.EMAIL_USER;
  }

  /** Resend dipakai bila API key tersedia — bukan hanya saat SMTP absen. */
  private get useResend(): boolean {
    return Boolean(config.RESEND_API_KEY);
  }

  private get transporter() {
    return config.EMAIL_HOST === 'smtp.sumopod.com'
      ? sumopodProvider()
      : baseProvider();
  }

  async send(opts: SendEmailOptions): Promise<void> {
    const text = opts.text ?? opts.html.replace(/<[^>]+>/g, '');

    try {
      if (this.useResend) {
        // Resend TIDAK melempar error HTTP-nya; ia mengembalikan `{ error }`,
        // jadi hasilnya harus diperiksa manual agar kegagalan tidak diam-diam.
        const { error } = await resendProvider().emails.send({
          from: this.from,
          to: opts.to,
          subject: opts.subject,
          html: opts.html,
          text,
        });

        if (error) {
          throw new Error(error.message ?? 'Resend gagal mengirim email');
        }
      } else {
        await this.transporter.sendMail({
          from: this.from,
          to: opts.to,
          subject: opts.subject,
          html: opts.html,
          text,
        });
      }

      this.logger.log(`Email terkirim ke ${opts.to}: ${opts.subject}`);
    } catch (err) {
      this.logger.error(`Gagal mengirim email ke ${opts.to}`, err);
      // Biarkan melempar — pemanggil bisa memutuskan apakah ini fatal.
      throw err;
    }
  }

  async sendForgotPassword(
    to: string,
    token: string,
    locale: EmailLocale = 'id',
  ): Promise<void> {
    const { buildForgotPasswordEmail } = await import('./template-email.js');
    const { subject, html, text } = buildForgotPasswordEmail(token, locale);
    // `text` dikirim eksplisit: template menyusunnya manual, jauh lebih rapi
    // daripada hasil `strip` tag HTML (lihat komentar di `template-email.ts`).
    await this.send({ to, subject, html, text });
  }

  async sendVerifyEmail(
    to: string,
    token: string,
    username: string,
    locale: EmailLocale = 'id',
  ): Promise<void> {
    const { buildVerifyEmailTemplate } = await import('./template-email.js');
    const { subject, html, text } = buildVerifyEmailTemplate(
      token,
      username,
      locale,
    );
    await this.send({ to, subject, html, text });
  }
}
