import { z } from "zod";

export const tenantRoleSchema = z.enum(["owner", "admin", "member", "viewer"]);

export type TenantRole = z.infer<typeof tenantRoleSchema>;
