import { getDb } from "../lib/db";
import lifeEvents from "../data/life-events.json";

function seed() {
  const db = getDb();
  console.log("Database initialized at data/bureaucracy.db");
  console.log(`Loaded ${lifeEvents.length} life events from seed data`);

  let totalForms = 0;
  for (const event of lifeEvents) {
    totalForms += event.forms.length;
  }
  console.log(`Total forms across all events: ${totalForms}`);
  console.log("Seed complete.");
}

seed();
