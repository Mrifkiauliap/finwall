import { createValidation } from "../../utils/createValidation";

const baseRules = {
  REQUIRED: "Value is required",
  OPTIONAL: "Value is optional",
  NULLABLE: "Value may be null",
  INVALID: "Value is invalid",
  EMPTY: "Value must not be empty",
  INVALID_CHARS: "Value contains invalid characters",
  MIN_LENGTH: "String is too short",
  MAX_LENGTH: "String is too long",
  LENGTH: "String must have exact length",
  EMAIL: "Invalid email address",
  NUMERIC: "Only numeric characters are allowed",
  NUMBER: "Must contain at least one number",
  LOWERCASE: "Must contain at least one lowercase letter",
  UPPERCASE: "Must contain at least one uppercase letter",
  HAS_SPECIAL_CHAR: "Must contain at least one special character",
} as const;

const fieldValidations = createValidation(
  {
    USERNAME: ["REQUIRED", "MIN_LENGTH", "MAX_LENGTH", "INVALID_CHARS"],
    EMAIL: ["REQUIRED", "INVALID"],
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
    INVALID_UUID: "Invalid UUID format",
    INVALID_EMAIL: "Invalid email address",
    TENANT_NAME_REQUIRED: "Workspace name is required",
    TENANT_NAME_TOO_LONG: "Workspace name cannot exceed 100 characters",
    INVITE_CODE_REQUIRED: "Invite code is required",
    INVALID_TENANT_ID: "Invalid workspace ID",
  },
} as const;
