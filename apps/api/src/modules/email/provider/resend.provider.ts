import getConfig from '@finwall/config/api';
import { Resend } from 'resend';

const config = getConfig();

/**
 * Provider Resend — gunakan bila RESEND_API_KEY tersedia.
 * Resend memberikan deliverability lebih baik untuk transactional email.
 *
 * Pastikan package `resend` terpasang:
 * pnpm add resend --filter @finwall/api
 */
let _client: Resend | null = null;

export function resendProvider(): Resend {
  if (!_client) {
    _client = new Resend(config.RESEND_API_KEY);
  }
  return _client;
}
