export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export type EmailProvider = 'base' | 'sumopod' | 'resend';
