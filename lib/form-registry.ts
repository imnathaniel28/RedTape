import lifeEvents from "@/data/life-events.json";
import { queryAll, execute } from "@/lib/db";

export interface FormInfo {
  form_name: string;
  agency: string;
  description: string;
  url: string;
  deadline: string;
  online_only: boolean;
  notes: string;
  fees?: string;
  processing_time?: string;
  prerequisites?: string;
}

export interface LifeEvent {
  event: string;
  label: string;
  description: string;
  forms: FormInfo[];
}

// In-memory copy seeded from JSON, extended at runtime by DB-persisted templates
const runtimeEvents: LifeEvent[] = [...(lifeEvents as LifeEvent[])];

export function getAllLifeEvents(): LifeEvent[] {
  return runtimeEvents;
}

/**
 * Add a new life event template to the registry.
 * Persists to Turso so it survives serverless cold starts.
 */
export async function addLifeEvent(event: LifeEvent): Promise<void> {
  if (runtimeEvents.some((e) => e.event === event.event)) return;
  runtimeEvents.push(event);

  try {
    await execute(
      "INSERT OR IGNORE INTO life_event_templates (event_key, event_data) VALUES (?, ?)",
      [event.event, JSON.stringify(event)]
    );
  } catch {
    // Non-fatal — event is still in memory for this session
  }
}

/**
 * Load any AI-researched templates saved in the DB into the in-memory registry.
 * Call this at the start of routes that list or search templates.
 */
export async function hydrateFromDb(): Promise<void> {
  try {
    const rows = await queryAll<{ event_key: string; event_data: string }>(
      "SELECT event_key, event_data FROM life_event_templates"
    );
    for (const row of rows) {
      const event = JSON.parse(row.event_data) as LifeEvent;
      if (!runtimeEvents.some((e) => e.event === event.event)) {
        runtimeEvents.push(event);
      }
    }
  } catch {
    // Non-fatal
  }
}

export function getLifeEvent(eventKey: string): LifeEvent | undefined {
  return runtimeEvents.find((e) => e.event === eventKey);
}

export function searchLifeEvents(query: string): LifeEvent[] {
  const lower = query.toLowerCase();
  return runtimeEvents.filter(
    (e) =>
      e.label.toLowerCase().includes(lower) ||
      e.description.toLowerCase().includes(lower) ||
      e.event.toLowerCase().includes(lower)
  );
}

export function getFormsForEvent(eventKey: string): FormInfo[] {
  const event = getLifeEvent(eventKey);
  return event?.forms ?? [];
}
