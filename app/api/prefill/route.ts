import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generatePrefillData } from "@/lib/prefiller";
import { queryOne, execute } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { form_id } = await req.json();
    if (!form_id) {
      return NextResponse.json(
        { success: false, error: "Missing 'form_id'" },
        { status: 400 }
      );
    }

    const form = await queryOne<{
      id: number;
      form_name: string;
      case_id: number;
    }>("SELECT * FROM case_forms WHERE id = ?", [form_id]);

    if (!form) {
      return NextResponse.json(
        { success: false, error: "Form not found" },
        { status: 404 }
      );
    }

    const prefillData = await generatePrefillData(form.form_name, userId);

    // Store prefill data on the form record
    await execute(
      "UPDATE case_forms SET prefill_data = ? WHERE id = ?",
      [JSON.stringify(prefillData), form_id]
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
