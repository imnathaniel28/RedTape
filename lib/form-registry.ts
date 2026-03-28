import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import lifeEvents from "@/data/life-events.json";

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

// In-memory copy that can be extended at runtime
const runtimeEvents: LifeEvent[] = [...(lifeEvents as LifeEvent[])];

export function getAllLifeEvents(): LifeEvent[] {
  return runtimeEvents;
}

/**
 * Add a new life event template to the registry.
 * Persists to the JSON file and updates the in-memory list.
 */
export function addLifeEvent(event: LifeEvent): void {
  // Skip if an event with this key already exists
  if (runtimeEvents.some((e) => e.event === event.event)) return;

  runtimeEvents.push(event);

  // Persist to disk so it survives restarts
  try {
    const filePath = join(process.cwd(), "data", "life-events.json");
    writeFileSync(filePath, JSON.stringify(runtimeEvents, null, 2), "utf-8");
  } catch {
    // Non-fatal — the event is still in memory for this session
  }
}

export function getLifeEvent(eventKey: string): LifeEvent | undefined {
  return (lifeEvents as LifeEvent[]).find((e) => e.event === eventKey);
}

export function searchLifeEvents(query: string): LifeEvent[] {
  const lower = query.toLowerCase();
  return (lifeEvents as LifeEvent[]).filter(
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
