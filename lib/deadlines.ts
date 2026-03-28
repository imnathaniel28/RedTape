import { getDb } from "./db";

export interface DeadlineInfo {
  id: number;
  case_id: number;
  case_form_id: number | null;
  title: string;
  due_date: string;
  reminder_sent: number;
}

/**
 * Auto-generate deadlines for a case based on form deadline text.
 * Parses common patterns like "within 30 days", "within 60 days", etc.
 * Uses the case creation date as the reference point.
 */
export function generateDeadlinesForCase(caseId: number): number {
  const db = getDb();

  const caseRow = db.prepare("SELECT created_at FROM cases WHERE id = ?").get(caseId) as
    | { created_at: string }
    | undefined;
  if (!caseRow) return 0;

  const caseDate = new Date(caseRow.created_at);

  const forms = db
    .prepare("SELECT id, form_name, deadline FROM case_forms WHERE case_id = ?")
    .all(caseId) as Array<{
    id: number;
    form_name: string;
    deadline: string | null;
  }>;

  // Check existing deadlines to avoid duplicates
  const existing = db
    .prepare("SELECT case_form_id FROM deadlines WHERE case_id = ?")
    .all(caseId) as Array<{ case_form_id: number | null }>;
  const existingFormIds = new Set(existing.map((e) => e.case_form_id));

  const insert = db.prepare(
    "INSERT INTO deadlines (case_id, case_form_id, title, due_date) VALUES (?, ?, ?, ?)"
  );

  let created = 0;
  for (const form of forms) {
    if (!form.deadline || existingFormIds.has(form.id)) continue;

    const dueDate = parseDeadlineText(form.deadline, caseDate);
    if (!dueDate) continue;

    insert.run(
      caseId,
      form.id,
      form.form_name,
      dueDate.toISOString().split("T")[0]
    );
    created++;
  }

  return created;
}

function parseDeadlineText(text: string, refDate: Date): Date | null {
  const lower = text.toLowerCase();

  // "within X days"
  const withinDays = lower.match(/within\s+(\d+)\s+days?/);
  if (withinDays) {
    const days = parseInt(withinDays[1], 10);
    const d = new Date(refDate);
    d.setDate(d.getDate() + days);
    return d;
  }

  // "X days advance notice"
  const advanceDays = lower.match(/(\d+)\s+days?\s+advance/);
  if (advanceDays) {
    // This is a "before event" deadline — use ref date minus days
    const days = parseInt(advanceDays[1], 10);
    const d = new Date(refDate);
    d.setDate(d.getDate() + days);
    return d;
  }

  // "within X months"
  const withinMonths = lower.match(/within\s+(\d+)\s+months?/);
  if (withinMonths) {
    const months = parseInt(withinMonths[1], 10);
    const d = new Date(refDate);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  // "April 15" — specific date pattern (tax deadlines)
  const specificMonth = lower.match(
    /(?:by\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/
  );
  if (specificMonth) {
    const monthNames: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    };
    const month = monthNames[specificMonth[1]];
    const day = parseInt(specificMonth[2], 10);
    const year = refDate.getFullYear();
    const d = new Date(year, month, day);
    // If the date has passed this year, use next year
    if (d < refDate) d.setFullYear(year + 1);
    return d;
  }

  // "before closing", "before move-in", "as soon as possible" — use 14 days as default
  if (
    lower.includes("before") ||
    lower.includes("as soon as possible") ||
    lower.includes("immediately")
  ) {
    const d = new Date(refDate);
    d.setDate(d.getDate() + 14);
    return d;
  }

  return null;
}

export function getUpcomingDeadlines(limit = 5): DeadlineInfo[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT d.* FROM deadlines d
       JOIN cases c ON d.case_id = c.id
       WHERE c.state = 'active'
       ORDER BY d.due_date ASC
       LIMIT ?`
    )
    .all(limit) as DeadlineInfo[];
}

export function getUrgentDeadlines(): DeadlineInfo[] {
  const db = getDb();
  const now = new Date().toISOString().split("T")[0];
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);
  const sevenDaysStr = sevenDays.toISOString().split("T")[0];

  return db
    .prepare(
      `SELECT d.* FROM deadlines d
       JOIN cases c ON d.case_id = c.id
       WHERE c.state = 'active' AND d.due_date <= ?
       ORDER BY d.due_date ASC`
    )
    .all(sevenDaysStr) as DeadlineInfo[];
}
