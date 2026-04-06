import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queryOne, execute } from "@/lib/db";
import { downloadPdf } from "@/lib/pdf/downloader";
import { extractFormFields, isXfaForm } from "@/lib/pdf/field-extractor";
import { fillPdfForm } from "@/lib/pdf/filler";
import { mapFieldsWithClaude } from "@/lib/ai/field-mapper";
import { getUserProfile } from "@/lib/prefiller";
import { fillPdfRequestSchema } from "@/lib/validations/api-schemas";
import { checkAutofillAccess, decrementAutofillCredit } from "@/lib/billing";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const autofillCheck = await checkAutofillAccess(userId);
    if (!autofillCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: autofillCheck.reason,
        upgrade_required: true,
      }, { status: 403 });
    }

    const body = await req.json();
    const parsed = fillPdfRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { form_id, overrides } = parsed.data;

    const form = await queryOne<{
      id: number;
      form_name: string;
      pdf_url: string | null;
      url: string;
      online_only: number;
      field_mapping: string | null;
    }>("SELECT * FROM case_forms WHERE id = ?", [form_id]);

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
      const profile = await getUserProfile(userId);
      if (!profile) {
        return NextResponse.json(
          { success: false, error: "Please complete your profile before filling forms." },
          { status: 400 }
        );
      }
      mapping = await mapFieldsWithClaude(form.form_name, fields, profile);

      await execute(
        "UPDATE case_forms SET field_mapping = ? WHERE id = ?",
        [JSON.stringify(mapping), form_id]
      );
    }

    // Apply user overrides
    if (overrides) {
      Object.assign(mapping, overrides);
      await execute(
        "UPDATE case_forms SET field_mapping = ? WHERE id = ?",
        [JSON.stringify(mapping), form_id]
      );
    }

    const filledPdf = await fillPdfForm(pdfBytes, mapping);

    // Mark as filled
    await execute("UPDATE case_forms SET pdf_filled = 1 WHERE id = ?", [form_id]);

    // Decrement autofill credit if user is not on Pro plan
    if (!autofillCheck.isPro) {
      await decrementAutofillCredit(userId);
    }

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
