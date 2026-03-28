import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "bureaucracy.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profile (
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
    );

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      life_event TEXT NOT NULL,
      description TEXT,
      state TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS case_forms (
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deadlines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER REFERENCES cases(id),
      case_form_id INTEGER REFERENCES case_forms(id),
      title TEXT NOT NULL,
      due_date TEXT NOT NULL,
      reminder_sent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add enriched columns if they don't exist (migration)
  const columns = db
    .prepare("PRAGMA table_info(case_forms)")
    .all() as { name: string }[];
  const colNames = columns.map((c) => c.name);
  if (!colNames.includes("fees")) {
    db.exec("ALTER TABLE case_forms ADD COLUMN fees TEXT");
  }
  if (!colNames.includes("processing_time")) {
    db.exec("ALTER TABLE case_forms ADD COLUMN processing_time TEXT");
  }
  if (!colNames.includes("prerequisites")) {
    db.exec("ALTER TABLE case_forms ADD COLUMN prerequisites TEXT");
  }
  if (!colNames.includes("pdf_url")) {
    db.exec("ALTER TABLE case_forms ADD COLUMN pdf_url TEXT");
  }
  if (!colNames.includes("field_mapping")) {
    db.exec("ALTER TABLE case_forms ADD COLUMN field_mapping TEXT");
  }
  if (!colNames.includes("pdf_filled")) {
    db.exec("ALTER TABLE case_forms ADD COLUMN pdf_filled INTEGER DEFAULT 0");
  }
  if (!colNames.includes("online_only")) {
    db.exec("ALTER TABLE case_forms ADD COLUMN online_only INTEGER DEFAULT 0");
  }

  // PDF field cache table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pdf_field_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_name TEXT NOT NULL UNIQUE,
      pdf_url TEXT,
      fields_json TEXT NOT NULL,
      extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure a default profile row exists
  const profile = db.prepare("SELECT id FROM user_profile WHERE id = 1").get();
  if (!profile) {
    db.prepare("INSERT INTO user_profile (id) VALUES (1)").run();
  }
}

export function resetDb() {
  const database = getDb();
  database.exec(`
    DROP TABLE IF EXISTS pdf_field_cache;
    DROP TABLE IF EXISTS deadlines;
    DROP TABLE IF EXISTS case_forms;
    DROP TABLE IF EXISTS cases;
    DROP TABLE IF EXISTS user_profile;
  `);
  initSchema(database);
}
