import getConfig from '@finwall/config/api';
import nodemailer from 'nodemailer';

const config = getConfig();

/**
 * Provider Sumopod — hardcoded ke smtp.sumopod.com:465 dengan TLS.
 * Berguna bila hanya EMAIL_USER / EMAIL_PASSWORD yang perlu diatur.
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.sumopod.com',
  port: 465,
  secure: true,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASSWORD,
  },
});

export function sumopodProvider() {
  return transporter;
}
