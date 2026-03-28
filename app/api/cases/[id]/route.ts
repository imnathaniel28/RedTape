import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { analyzeDependencies, sortByDependencyOrder } from "@/lib/dependencies";
import { getTimeEstimate } from "@/lib/time-estimates";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const caseData = db.prepare("SELECT * FROM cases WHERE id = ?").get(id) as {
      id: number;
      life_event: string;
      [key: string]: unknown;
    } | undefined;
    if (!caseData) {
      return NextResponse.json(
        { success: false, error: "Case not found" },
        { status: 404 }
      );
    }

    const rawForms = db
      .prepare("SELECT * FROM case_forms WHERE case_id = ? ORDER BY id")
      .all(id) as Array<{ id: number; form_name: string; status: string; [key: string]: unknown }>;

    // Sort by dependency order and annotate with dependency info
    const sorted = sortByDependencyOrder(caseData.life_event, rawForms);
    const deps = analyzeDependencies(
      caseData.life_event,
      sorted.map((f) => ({ form_name: f.form_name, status: f.status }))
    );
    const depsMap = new Map(deps.map((d) => [d.formName, d]));

    const forms = sorted.map((f) => {
      const dep = depsMap.get(f.form_name);
      return {
        ...f,
        is_blocked: dep?.isBlocked ?? false,
        blocked_by: dep?.blockedBy ?? [],
        depends_on: dep?.dependsOn ?? [],
      };
    });

    const deadlines = db
      .prepare(
        "SELECT * FROM deadlines WHERE case_id = ? ORDER BY due_date ASC"
      )
      .all(id);

    const timeEstimate = getTimeEstimate(caseData.life_event);

    return NextResponse.json({
      success: true,
      data: { ...caseData, forms, deadlines, time_estimate: timeEstimate },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();

    if (body.state) {
      db.prepare(
        "UPDATE cases SET state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(body.state, id);
    }

    const updated = db.prepare("SELECT * FROM cases WHERE id = ?").get(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
