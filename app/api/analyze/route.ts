import { NextRequest, NextResponse } from "next/server";
import { analyzeLifeEvent } from "@/lib/analyzer";
import { getDb } from "@/lib/db";
import { generateDeadlinesForCase } from "@/lib/deadlines";
import { addLifeEvent, type LifeEvent } from "@/lib/form-registry";
import { researchLifeEvent } from "@/lib/ai/research";
import pdfSources from "@/data/pdf-sources.json";

const pdfSourceMap = pdfSources as Record<
  string,
  { pdf_url: string; fillable: boolean }
>;

function createCaseFromEvent(event: LifeEvent, description: string) {
  const db = getDb();

  const caseResult = db
    .prepare("INSERT INTO cases (life_event, description) VALUES (?, ?)")
    .run(event.event, description);

  const caseId = Number(caseResult.lastInsertRowid);

  const insertForm = db.prepare(`
    INSERT INTO case_forms (case_id, form_name, agency, description, url, deadline, notes, fees, processing_time, prerequisites, online_only, pdf_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const form of event.forms) {
    const pdfSource = pdfSourceMap[form.form_name];
    insertForm.run(
      caseId,
      form.form_name,
      form.agency,
      form.description,
      form.url,
      form.deadline ?? null,
      form.notes,
      form.fees ?? null,
      form.processing_time ?? null,
      form.prerequisites ?? null,
      form.online_only ? 1 : 0,
      pdfSource?.pdf_url ?? null
    );
  }

  generateDeadlinesForCase(caseId);
  return caseId;
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing 'text' field" },
        { status: 400 }
      );
    }

    const analysis = analyzeLifeEvent(text);
    let topEvent: LifeEvent;
    let aiGenerated = false;

    if (analysis.matched_events.length > 0 && analysis.confidence > 0.5) {
      topEvent = analysis.matched_events[0];
    } else {
      // No keyword match — use AI to research forms for this event
      try {
        topEvent = await researchLifeEvent(text);
        aiGenerated = true;

        // Save as a new template so it's available for future use
        addLifeEvent(topEvent);
      } catch (aiError) {
        return NextResponse.json({
          success: false,
          error:
            "We couldn't find forms for that request. Make sure your ANTHROPIC_API_KEY is set and try again.",
        });
      }
    }

    const caseId = createCaseFromEvent(topEvent, text);

    return NextResponse.json({
      success: true,
      data: {
        case_id: caseId,
        life_event: topEvent,
        all_matches: aiGenerated
          ? [topEvent.label]
          : analysis.matched_events.map((e) => e.label),
        confidence: aiGenerated ? 0.8 : analysis.confidence,
        ai_generated: aiGenerated,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
