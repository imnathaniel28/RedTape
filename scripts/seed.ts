import { ensureSchema } from "../lib/db";

async function seed() {
  await ensureSchema();
  console.log("Schema initialized successfully.");
}

seed();
