// Source of truth zod untuk contract lintas aplikasi (backend & frontend).
// Kode error (bukan pesan lokal) dipakai agar frontend bisa lakukan i18n.
export * from "./schemas/api.js";
export * from "./schemas/tenant-role.js";
export * from "./schemas/tenant.js";
export * from "./schemas/workspace-template.js";

export * from "./schemas/account.js";
export * from "./schemas/auth.js";
export * from "./schemas/dashboard.js";
export * from "./schemas/user.js";

// Data template awal workspace (dipakai backend seeder & db seed).
export * from "./workspace-templates.js";
