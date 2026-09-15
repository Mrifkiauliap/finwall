import { createValidation } from '../../utils/createValidation'

const baseRules = {
  REQUIRED: 'Value is required',
  OPTIONAL: 'Value is optional',
  NULLABLE: 'Value may be null',
  INVALID: 'Value is invalid',
  EMPTY: 'Value must not be empty',
  INVALID_CHARS: 'Value contains invalid characters',
  MIN_LENGTH: 'String is too short',
  MAX_LENGTH: 'String is too long',
  LENGTH: 'String must have exact length',
  EMAIL: 'Invalid email address',
  NUMERIC: 'Only numeric characters are allowed',
  NUMBER: 'Must contain at least one number',
  LOWERCASE: 'Must contain at least one lowercase letter',
  UPPERCASE: 'Must contain at least one uppercase letter',
  HAS_SPECIAL_CHAR: 'Must contain at least one special character',
} as const

const fieldValidations = createValidation(
  {
    USERNAME: ['REQUIRED', 'MIN_LENGTH', 'MAX_LENGTH', 'INVALID_CHARS'],
    EMAIL: ['REQUIRED', 'INVALID'],
    PHONE: ['NULLABLE', 'MIN_LENGTH', 'MAX_LENGTH', 'NUMERIC'],
    PASSWORD: [
      'REQUIRED',
      'MIN_LENGTH',
      'MAX_LENGTH',
      'UPPERCASE',
      'LOWERCASE',
      'NUMBER',
      'NUMERIC',
      'HAS_SPECIAL_CHAR',
    ],
    TIMEZONE: ['OPTIONAL'],
    IDENTIFIER: ['REQUIRED', 'MIN_LENGTH'],
  },
  baseRules,
)

export default {
  validation: {
    ...baseRules,
    ...fieldValidations,
    INVALID_UUID: 'Invalid UUID format',
    INVALID_EMAIL: 'Invalid email address',
    TENANT_NAME_REQUIRED: 'Workspace name is required',
    TENANT_NAME_TOO_LONG: 'Workspace name cannot exceed 100 characters',
    INVITE_CODE_REQUIRED: 'Invite code is required',
    INVALID_TENANT_ID: 'Invalid workspace ID',

    // Accounts
    ACCOUNT_NAME_REQUIRED: 'Account name is required',
    ACCOUNT_NAME_TOO_LONG: 'Account name cannot exceed 100 characters',
    ACCOUNT_NAME_TAKEN: 'This account name is already used in this workspace',
    ACCOUNT_KIND_INVALID: 'Invalid account type',
    ACCOUNT_GROUP_INVALID: 'Invalid account category',
    ACCOUNT_BALANCE_INVALID: 'Invalid balance',
    ACCOUNT_NOT_FOUND: 'Account not found',
    ACCOUNT_HAS_TRANSACTIONS: 'This account still has transactions. Remove them first.',
    ACCOUNT_UPDATE_EMPTY: 'No changes were submitted',

    // Transactions
    TRANSACTION_TYPE_INVALID: 'Invalid transaction type',
    AMOUNT_INVALID: 'Invalid amount',
    AMOUNT_POSITIVE: 'Amount must be greater than 0',
    CATEGORY_REQUIRED: 'Category is required',
    ACCOUNT_REQUIRED: 'Account is required',
    TO_ACCOUNT_REQUIRED: 'Destination account is required for transfers',
    TO_ACCOUNT_SAME: 'Destination account must differ from the source account',
    DATE_REQUIRED: 'Date is required',
    DATE_INVALID: 'Invalid date format',
    NOTE_TOO_LONG: 'Note cannot exceed 280 characters',
    CURRENCY_INVALID: 'Invalid currency code',
  },
} as const
