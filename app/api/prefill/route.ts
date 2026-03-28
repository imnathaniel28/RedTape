import { NextRequest, NextResponse } from "next/server";
import { generatePrefillData } from "@/lib/prefiller";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { form_id } = await req.json();
    if (!form_id) {
      return NextResponse.json(
        { success: false, error: "Missing 'form_id'" },
        { status: 400 }
      );
    }

    const db = getDb();
    const form = db
      .prepare("SELECT * FROM case_forms WHERE id = ?")
      .get(form_id) as { id: number; form_name: string; case_id: number } | undefined;

    if (!form) {
      return NextResponse.json(
        { success: false, error: "Form not found" },
        { status: 404 }
      );
    }

    const prefillData = generatePrefillData(form.form_name);

    // Store prefill data on the form record
    db.prepare("UPDATE case_forms SET prefill_data = ? WHERE id = ?").run(
      JSON.stringify(prefillData),
      form_id
    );

    return NextResponse.json({
      success: true,
      data: {
        form_id: form.id,
        form_name: form.form_name,
        prefill_data: prefillData,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
