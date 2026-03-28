import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const cases = db
      .prepare(
        `SELECT c.*,
          (SELECT COUNT(*) FROM case_forms cf WHERE cf.case_id = c.id) as total_forms,
          (SELECT COUNT(*) FROM case_forms cf WHERE cf.case_id = c.id AND cf.status = 'completed') as completed_forms,
          (SELECT COUNT(*) FROM case_forms cf WHERE cf.case_id = c.id AND cf.status = 'in_progress') as in_progress_forms,
          (SELECT COUNT(*) FROM case_forms cf WHERE cf.case_id = c.id AND cf.status = 'submitted') as submitted_forms,
          (SELECT MIN(d.due_date) FROM deadlines d WHERE d.case_id = c.id AND d.due_date >= date('now')) as next_deadline
        FROM cases c
        ORDER BY c.created_at DESC`
      )
      .all();

    return NextResponse.json({ success: true, data: cases });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { life_event, description } = await req.json();
    if (!life_event) {
      return NextResponse.json(
        { success: false, error: "Missing 'life_event'" },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = db
      .prepare("INSERT INTO cases (life_event, description) VALUES (?, ?)")
      .run(life_event, description ?? null);

    const newCase = db
      .prepare("SELECT * FROM cases WHERE id = ?")
      .get(result.lastInsertRowid);

    return NextResponse.json({ success: true, data: newCase });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
