import type { ApiErrorList, ZodError } from '@finwall/shared';
import { BadRequestException } from '@nestjs/common';

/**
 * Normalisasi ZodError menjadi format API lintas-frontend:
 * `[{ path: string[], code: string }]`.
 *
 * `code` diambil dari `issue.message` (application error code — pesan yang
 * di-set via `{ error: "CODE" }` di shared schema), BUKAN `issue.code`
 * internal Zod (`too_small`, `invalid_format`, dst) yang tidak boleh bocor.
 * Frontend melakukan localization/i18n berdasarkan `code`.
 */
export function normalizeZodError(error: ZodError): ApiErrorList {
  return error.issues.map((issue) => ({
    path: issue.path.map(String),
    code: issue.message,
  }));
}

/** Lempar BadRequestException berisi daftar error ter-normalisasi. */
export function throwZodBadRequest(error: ZodError): never {
  throw new BadRequestException({
    errors: normalizeZodError(error),
  });
}
