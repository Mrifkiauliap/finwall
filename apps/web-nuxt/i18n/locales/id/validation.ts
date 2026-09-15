import { createValidation } from "../../utils/createValidation";

const baseRules = {
  REQUIRED: "Nilai wajib diisi",
  OPTIONAL: "Nilai opsional",
  NULLABLE: "Nilai boleh kosong",
  INVALID: "Nilai tidak valid",
  INVALID_EMAIL: "Format email tidak valid",
  EMPTY: "Nilai tidak boleh kosong",
  INVALID_CHARS: "Mengandung karakter tidak valid",
  MIN_LENGTH: "Terlalu pendek",
  MAX_LENGTH: "Terlalu panjang",
  LENGTH: "Panjang karakter tidak sesuai",
  EMAIL: "Format email tidak valid",
  NUMERIC: "Hanya boleh berisi angka",
  NUMBER: "Harus mengandung minimal 1 angka",
  LOWERCASE: "Harus mengandung minimal 1 huruf kecil",
  UPPERCASE: "Harus mengandung minimal 1 huruf besar",
  HAS_SPECIAL_CHAR: "Harus mengandung minimal 1 karakter khusus",
} as const;

const fieldValidations = createValidation(
  {
    USERNAME: ["REQUIRED", "MIN_LENGTH", "MAX_LENGTH", "INVALID_CHARS"],
    EMAIL: ["REQUIRED", "INVALID_EMAIL"],
    PHONE: ["NULLABLE", "MIN_LENGTH", "MAX_LENGTH", "NUMERIC"],
    PASSWORD: [
      "REQUIRED",
      "MIN_LENGTH",
      "MAX_LENGTH",
      "UPPERCASE",
      "LOWERCASE",
      "NUMBER",
      "NUMERIC",
      "HAS_SPECIAL_CHAR",
    ],
    TIMEZONE: ["OPTIONAL"],
    IDENTIFIER: ["REQUIRED", "MIN_LENGTH"],
  },
  baseRules,
);

export default {
  validation: {
    ...baseRules,
    ...fieldValidations,
    INVALID_UUID: "Format UUID tidak valid",
    INVALID_EMAIL: "Format email tidak valid",
    TENANT_NAME_REQUIRED: "Nama workspace wajib diisi",
    TENANT_NAME_TOO_LONG: "Nama workspace maksimal 100 karakter",
    INVITE_CODE_REQUIRED: "Kode undangan wajib diisi",
    INVALID_TENANT_ID: "ID workspace tidak valid",
  },
} as const;
