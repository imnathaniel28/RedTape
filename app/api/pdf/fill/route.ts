import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { downloadPdf } from "@/lib/pdf/downloader";
import { extractFormFields, isXfaForm } from "@/lib/pdf/field-extractor";
import { fillPdfForm } from "@/lib/pdf/filler";
import { mapFieldsWithClaude } from "@/lib/ai/field-mapper";
import { getUserProfile } from "@/lib/prefiller";
import { fillPdfRequestSchema } from "@/lib/validations/api-schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = fillPdfRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { form_id, overrides } = parsed.data;
    const db = getDb();

    const form = db
      .prepare("SELECT * FROM case_forms WHERE id = ?")
      .get(form_id) as {
      id: number;
      form_name: string;
      pdf_url: string | null;
      url: string;
      online_only: number;
      field_mapping: string | null;
    } | undefined;

    if (!form) {
      return NextResponse.json(
        { success: false, error: "Form not found" },
        { status: 404 }
      );
    }

    const pdfUrl = form.pdf_url ?? (form.url.endsWith(".pdf") ? form.url : null);
    if (!pdfUrl) {
      return NextResponse.json(
        { success: false, error: "No PDF URL available" },
        { status: 400 }
      );
    }

    const pdfBytes = await downloadPdf(pdfUrl);

    if (isXfaForm(pdfBytes)) {
      return NextResponse.json({
        success: false,
        error: "This form uses XFA format which cannot be auto-filled.",
      }, { status: 400 });
    }

    // Get or generate field mapping
    let mapping: Record<string, string>;
    if (form.field_mapping) {
      mapping = JSON.parse(form.field_mapping);
    } else {
      const fields = await extractFormFields(pdfBytes);
      const profile = getUserProfile();
      mapping = await mapFieldsWithClaude(form.form_name, fields, profile);

      db.prepare("UPDATE case_forms SET field_mapping = ? WHERE id = ?").run(
        JSON.stringify(mapping),
        form_id
      );
    }

    // Apply user overrides
    if (overrides) {
      Object.assign(mapping, overrides);
      db.prepare("UPDATE case_forms SET field_mapping = ? WHERE id = ?").run(
        JSON.stringify(mapping),
        form_id
      );
    }

    const filledPdf = await fillPdfForm(pdfBytes, mapping);

    // Mark as filled
    db.prepare("UPDATE case_forms SET pdf_filled = 1 WHERE id = ?").run(form_id);

    return new Response(Buffer.from(filledPdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${form.form_name.replace(/[^a-zA-Z0-9.-]/g, "_")}_filled.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
