import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queryOne, queryAll, execute } from "@/lib/db";
import { analyzeDependencies, sortByDependencyOrder } from "@/lib/dependencies";
import { getTimeEstimate } from "@/lib/time-estimates";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const caseData = await queryOne<{
      id: number;
      life_event: string;
      user_id: string | null;
      [key: string]: unknown;
    }>("SELECT * FROM cases WHERE id = ?", [id]);

    if (!caseData) {
      return NextResponse.json(
        { success: false, error: "Case not found" },
        { status: 404 }
      );
    }

    if (caseData.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const rawForms = await queryAll<{
      id: number;
      form_name: string;
      status: string;
      [key: string]: unknown;
    }>("SELECT * FROM case_forms WHERE case_id = ? ORDER BY id", [id]);

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

    const deadlines = await queryAll(
      "SELECT * FROM deadlines WHERE case_id = ? ORDER BY due_date ASC",
      [id]
    );

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const caseData = await queryOne<{ user_id: string | null }>(
      "SELECT user_id FROM cases WHERE id = ?",
      [id]
    );

    if (!caseData) {
      return NextResponse.json(
        { success: false, error: "Case not found" },
        { status: 404 }
      );
    }

    if (caseData.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (body.state) {
      await execute(
        "UPDATE cases SET state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [body.state, id]
      );
    }

    const updated = await queryOne("SELECT * FROM cases WHERE id = ?", [id]);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
