import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAllLifeEvents, getFormsForEvent } from "@/lib/form-registry";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const event = searchParams.get("event");
    const caseId = searchParams.get("case_id");

    // Return forms from database for a specific case
    if (caseId) {
      const db = getDb();
      const forms = db
        .prepare("SELECT * FROM case_forms WHERE case_id = ? ORDER BY id")
        .all(caseId);
      return NextResponse.json({ success: true, data: forms });
    }

    // Return forms from registry for a life event
    if (event) {
      const forms = getFormsForEvent(event);
      return NextResponse.json({ success: true, data: forms });
    }

    // Return all life events
    const events = getAllLifeEvents();
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, notes } = await req.json();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing form 'id'" },
        { status: 400 }
      );
    }

    const db = getDb();
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (status) {
      updates.push("status = ?");
      values.push(status);
    }
    if (notes !== undefined) {
      updates.push("notes = ?");
      values.push(notes);
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(
        `UPDATE case_forms SET ${updates.join(", ")} WHERE id = ?`
      ).run(...values);
    }

    const updated = db.prepare("SELECT * FROM case_forms WHERE id = ?").get(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
