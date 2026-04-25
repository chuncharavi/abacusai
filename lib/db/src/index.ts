import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DO_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[db] WARNING: Neither DO_DATABASE_URL nor DATABASE_URL is set. " +
    "Database operations will fail. Set DO_DATABASE_URL or DATABASE_URL to connect to a database."
  );
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes("ondigitalocean.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
