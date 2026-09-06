import { getCacheClient } from '@finwall/cache';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  async check(): Promise<{ status: string; ts: number; valkey: string }> {
    let valkeyStatus = 'unknown';
    try {
      const ping = await getCacheClient().ping(); // Valkey conn
      valkeyStatus = ping === 'PONG' ? 'ok' : 'error';
    } catch {
      valkeyStatus = 'error';
    }

    return {
      status: valkeyStatus === 'ok' ? 'healthy' : 'degraded',
      ts: Date.now(),
      valkey: valkeyStatus,
    };
  }
}
