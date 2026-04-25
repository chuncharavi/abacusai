import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DO_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DO_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isDigitalOcean = connectionString.includes("ondigitalocean.com");

export const pool = new Pool({
  connectionString,
  ssl: isDigitalOcean ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
