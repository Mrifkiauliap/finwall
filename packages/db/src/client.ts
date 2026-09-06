import getConfig from "@finwall/config/api";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const config = getConfig();

const pool = new Pool({
  host: config.DATABASE_HOST,
  port: config.DATABASE_PORT,
  user: config.DATABASE_USER,
  password: config.DATABASE_PASSWORD,
  database: config.DATABASE_NAME,
});

export const db = drizzle(pool, { schema });
export type Drizzle = typeof db;
export default db;
