import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

const fallbackUrl = "postgresql://user:password@localhost:5432/geniuslab";
const sql = neon(process.env.DATABASE_URL || fallbackUrl);

export const db = drizzle(sql, { schema });
export type Db = typeof db;
