import getConfig from '@finwall/config/api';
import nodemailer from 'nodemailer';

const config = getConfig();

/**
 * Provider nodemailer generik — host/port/user/pass dari env.
 * Cocok untuk SMTP apapun yang dikonfigurasi via .env.
 */
const transporter = nodemailer.createTransport({
  host: config.EMAIL_HOST,
  port: config.EMAIL_PORT,
  secure: config.EMAIL_SECURE,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASSWORD,
  },
});

export function baseProvider() {
  return transporter;
}
