import type { ApiErrorList } from "@finwall/shared";

/**
 * Terjemahkan error dari backend menjadi pesan yang siap ditampilkan.
 *
 * Backend menormalkan `ZodError` menjadi `{ errors: [{ path, code }] }` di dalam
 * body BadRequestException; `code` adalah application code (mis.
 * `PASSWORD_MIN_LENGTH`) yang dipetakan ke i18n di sini. Untuk error non-validasi
 * (401/403/404/5xx) backend mengirim `message` biasa.
 */
export function useApiError() {
  const { t } = useI18n();

  function translateCode(code: string): string {
    // Kode aplikasi cocok dengan key validation.*
    const key = `validation.${code}`;
    const translated = t(key);
    return translated === key ? code : translated;
  }

  function resolve(err: unknown): string {
    const anyErr = err as any;
    const data = anyErr?.response?.data;

    const errors = data?.errors as ApiErrorList | undefined;
    if (Array.isArray(errors) && errors.length > 0) {
      return errors.map((e) => translateCode(e.code)).join(", ");
    }

    return data?.message || anyErr?.message || t("notification.TITLE.ERROR");
  }

  return { resolve, translateCode };
}
