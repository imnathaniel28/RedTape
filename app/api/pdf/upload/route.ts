import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queryOne, execute } from "@/lib/db";
import { cachePdfBytes } from "@/lib/pdf/downloader";
import { extractFormFields, isXfaForm } from "@/lib/pdf/field-extractor";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const formId = formData.get("form_id");
    const file = formData.get("file");

    if (!formId || !file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "Missing form_id or file" },
        { status: 400 }
      );
    }

    const form = await queryOne<{
      id: number;
      form_name: string;
      pdf_url: string | null;
    }>("SELECT * FROM case_forms WHERE id = ?", [Number(formId)]);

    if (!form) {
      return NextResponse.json(
        { success: false, error: "Form not found" },
        { status: 404 }
      );
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Verify it's a PDF
    const header = new TextDecoder("latin1").decode(bytes.slice(0, 5));
    if (!header.startsWith("%PDF")) {
      return NextResponse.json(
        { success: false, error: "Uploaded file is not a valid PDF" },
        { status: 400 }
      );
    }

    if (isXfaForm(bytes)) {
      return NextResponse.json({
        success: false,
        error: "This PDF uses XFA format which cannot be auto-filled. Please fill it manually.",
      }, { status: 400 });
    }

    // Cache the uploaded PDF using a synthetic URL key
    const syntheticUrl = `upload://${form.id}/${form.form_name}`;
    cachePdfBytes(syntheticUrl, bytes);

    // Update the form record with the synthetic pdf_url
    await execute(
      "UPDATE case_forms SET pdf_url = ? WHERE id = ?",
      [syntheticUrl, form.id]
    );

    // Extract and cache fields
    const fields = await extractFormFields(bytes);
    await execute(
      "INSERT OR REPLACE INTO pdf_field_cache (form_name, pdf_url, fields_json) VALUES (?, ?, ?)",
      [form.form_name, syntheticUrl, JSON.stringify(fields)]
    );

    return NextResponse.json({
      success: true,
      data: {
        fields_count: fields.length,
        message: `PDF uploaded. ${fields.length} fillable fields detected.`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
