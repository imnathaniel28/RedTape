import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queryOne, queryAll, execute } from "@/lib/db";
import { getAllLifeEvents, getFormsForEvent } from "@/lib/form-registry";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const event = searchParams.get("event");
    const caseId = searchParams.get("case_id");

    // Return forms from database for a specific case
    if (caseId) {
      // Verify the case belongs to this user
      const caseData = await queryOne<{ user_id: string | null }>(
        "SELECT user_id FROM cases WHERE id = ?",
        [caseId]
      );
      if (!caseData || caseData.user_id !== userId) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      const forms = await queryAll(
        "SELECT * FROM case_forms WHERE case_id = ? ORDER BY id",
        [caseId]
      );
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, status, notes } = await req.json();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing form 'id'" },
        { status: 400 }
      );
    }

    // Verify the form's case belongs to this user
    const form = await queryOne<{ case_id: number }>(
      "SELECT case_id FROM case_forms WHERE id = ?",
      [id]
    );
    if (!form) {
      return NextResponse.json(
        { success: false, error: "Form not found" },
        { status: 404 }
      );
    }
    const caseData = await queryOne<{ user_id: string | null }>(
      "SELECT user_id FROM cases WHERE id = ?",
      [form.case_id]
    );
    if (!caseData || caseData.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

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
      await execute(
        `UPDATE case_forms SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
    }

    const updated = await queryOne("SELECT * FROM case_forms WHERE id = ?", [id]);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
