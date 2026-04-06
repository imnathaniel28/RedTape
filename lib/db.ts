import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;
let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:data/bureaucracy.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

async function initSchema(): Promise<void> {
  const c = getClient();

  await c.batch([
    `CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      full_name TEXT,
      date_of_birth TEXT,
      ssn_last4 TEXT,
      address_street TEXT,
      address_city TEXT,
      address_state TEXT,
      address_zip TEXT,
      phone TEXT,
      email TEXT,
      drivers_license TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      life_event TEXT NOT NULL,
      description TEXT,
      state TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS case_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER REFERENCES cases(id),
      form_name TEXT NOT NULL,
      agency TEXT,
      description TEXT,
      url TEXT,
      status TEXT DEFAULT 'not_started',
      deadline TEXT,
      notes TEXT,
      prefill_data TEXT,
      fees TEXT,
      processing_time TEXT,
      prerequisites TEXT,
      pdf_url TEXT,
      field_mapping TEXT,
      pdf_filled INTEGER DEFAULT 0,
      online_only INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS deadlines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER REFERENCES cases(id),
      case_form_id INTEGER REFERENCES case_forms(id),
      title TEXT NOT NULL,
      due_date TEXT NOT NULL,
      reminder_sent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS pdf_field_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_name TEXT NOT NULL UNIQUE,
      pdf_url TEXT,
      fields_json TEXT NOT NULL,
      extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS life_event_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_key TEXT NOT NULL UNIQUE,
      event_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS search_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      query_text TEXT NOT NULL,
      matched_event TEXT,
      ai_generated INTEGER DEFAULT 0,
      success INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      plan TEXT DEFAULT 'free',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      searches_used INTEGER DEFAULT 0,
      autofill_credits INTEGER DEFAULT 0,
      period_start TEXT,
      period_end TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ]);

  // Migrations: add user_id columns to existing tables (safe to run repeatedly)
  try {
    await c.execute({ sql: "ALTER TABLE user_profile ADD COLUMN user_id TEXT", args: [] });
  } catch {
    // Column already exists — ignore
  }
  try {
    await c.execute({ sql: "ALTER TABLE cases ADD COLUMN user_id TEXT", args: [] });
  } catch {
    // Column already exists — ignore
  }

  schemaReady = true;
}

export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  if (!schemaPromise) {
    schemaPromise = initSchema();
  }
  return schemaPromise;
}

export async function queryAll<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = []
): Promise<T[]> {
  await ensureSchema();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await getClient().execute({ sql, args: args as any });
  return result.rows as unknown as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = []
): Promise<T | undefined> {
  await ensureSchema();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await getClient().execute({ sql, args: args as any });
  return result.rows[0] as unknown as T | undefined;
}

export async function execute(
  sql: string,
  args: unknown[] = []
): Promise<{ lastInsertRowid: number; rowsAffected: number }> {
  await ensureSchema();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await getClient().execute({ sql, args: args as any });
  return {
    lastInsertRowid: Number(result.lastInsertRowid ?? 0),
    rowsAffected: result.rowsAffected,
  };
}

export async function resetDb(): Promise<void> {
  schemaReady = false;
  schemaPromise = null;
  const c = getClient();
  await c.batch([
    "DROP TABLE IF EXISTS pdf_field_cache",
    "DROP TABLE IF EXISTS deadlines",
    "DROP TABLE IF EXISTS case_forms",
    "DROP TABLE IF EXISTS cases",
    "DROP TABLE IF EXISTS user_profile",
  ]);
  await initSchema();
}
