import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { downloadPdf } from "@/lib/pdf/downloader";
import { extractFormFields, isXfaForm } from "@/lib/pdf/field-extractor";
import { mapFieldsWithClaude } from "@/lib/ai/field-mapper";
import { getUserProfile } from "@/lib/prefiller";
import { validateProfileForFill } from "@/lib/validations/form-fields";
import { pdfFieldsRequestSchema } from "@/lib/validations/api-schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = pdfFieldsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { form_id } = parsed.data;
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

    if (form.online_only) {
      return NextResponse.json(
        { success: false, error: "This form is online-only and cannot be filled as a PDF" },
        { status: 400 }
      );
    }

    const pdfUrl = form.pdf_url ?? (form.url.endsWith(".pdf") ? form.url : null);
    if (!pdfUrl) {
      return NextResponse.json(
        { success: false, error: "No PDF URL available. Upload the PDF manually." },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = db
      .prepare("SELECT fields_json FROM pdf_field_cache WHERE form_name = ?")
      .get(form.form_name) as { fields_json: string } | undefined;

    let fields;
    if (cached) {
      fields = JSON.parse(cached.fields_json);
    } else {
      const pdfBytes = await downloadPdf(pdfUrl);

      if (isXfaForm(pdfBytes)) {
        return NextResponse.json({
          success: false,
          error: "This form uses XFA format which cannot be auto-filled. Please download and fill it manually.",
        }, { status: 400 });
      }

      fields = await extractFormFields(pdfBytes);

      // Cache the extracted fields
      db.prepare(
        "INSERT OR REPLACE INTO pdf_field_cache (form_name, pdf_url, fields_json) VALUES (?, ?, ?)"
      ).run(form.form_name, pdfUrl, JSON.stringify(fields));
    }

    // Get suggested mapping from Claude
    const profile = getUserProfile();
    const profileValidation = validateProfileForFill(profile as unknown as Record<string, unknown>);

    let suggestedMapping: Record<string, string> = {};
    if (fields.length > 0) {
      // Use existing mapping if available, otherwise call Claude
      if (form.field_mapping) {
        suggestedMapping = JSON.parse(form.field_mapping);
      } else {
        suggestedMapping = await mapFieldsWithClaude(form.form_name, fields, profile);
        // Save the mapping for reuse
        db.prepare("UPDATE case_forms SET field_mapping = ? WHERE id = ?").run(
          JSON.stringify(suggestedMapping),
          form_id
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        fields,
        suggestedMapping,
        profileWarnings: profileValidation.warnings,
        formName: form.form_name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
