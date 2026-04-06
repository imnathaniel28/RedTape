import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queryOne, queryAll, execute } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const cases = await queryAll(
      `SELECT c.*,
        (SELECT COUNT(*) FROM case_forms cf WHERE cf.case_id = c.id) as total_forms,
        (SELECT COUNT(*) FROM case_forms cf WHERE cf.case_id = c.id AND cf.status = 'completed') as completed_forms,
        (SELECT COUNT(*) FROM case_forms cf WHERE cf.case_id = c.id AND cf.status = 'in_progress') as in_progress_forms,
        (SELECT COUNT(*) FROM case_forms cf WHERE cf.case_id = c.id AND cf.status = 'submitted') as submitted_forms,
        (SELECT MIN(d.due_date) FROM deadlines d WHERE d.case_id = c.id AND d.due_date >= date('now')) as next_deadline
      FROM cases c
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC`,
      [userId]
    );

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { life_event, description } = await req.json();
    if (!life_event) {
      return NextResponse.json(
        { success: false, error: "Missing 'life_event'" },
        { status: 400 }
      );
    }

    const result = await execute(
      "INSERT INTO cases (life_event, description, user_id) VALUES (?, ?, ?)",
      [life_event, description ?? null, userId]
    );

    const newCase = await queryOne(
      "SELECT * FROM cases WHERE id = ?",
      [result.lastInsertRowid]
    );

    return NextResponse.json({ success: true, data: newCase });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
