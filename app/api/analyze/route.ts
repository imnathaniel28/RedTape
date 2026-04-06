import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyzeLifeEvent } from "@/lib/analyzer";
import { queryOne, execute } from "@/lib/db";
import { generateDeadlinesForCase } from "@/lib/deadlines";
import { addLifeEvent, type LifeEvent } from "@/lib/form-registry";
import { researchLifeEvent } from "@/lib/ai/research";
import { checkAndIncrementSearch } from "@/lib/billing";
import pdfSources from "@/data/pdf-sources.json";

async function logSearch(
  userId: string,
  queryText: string,
  matchedEvent: string | null,
  aiGenerated: boolean,
  success: boolean
) {
  try {
    await execute(
      "INSERT INTO search_logs (user_id, query_text, matched_event, ai_generated, success) VALUES (?, ?, ?, ?, ?)",
      [userId, queryText, matchedEvent, aiGenerated ? 1 : 0, success ? 1 : 0]
    );
  } catch {
    // Non-fatal — never block the main flow
  }
}

const pdfSourceMap = pdfSources as Record<
  string,
  { pdf_url: string; fillable: boolean }
>;

async function createCaseFromEvent(event: LifeEvent, description: string, userId: string) {
  const caseResult = await execute(
    "INSERT INTO cases (life_event, description, user_id) VALUES (?, ?, ?)",
    [event.event, description, userId]
  );

  const caseId = Number(caseResult.lastInsertRowid);

  for (const form of event.forms) {
    const pdfSource = pdfSourceMap[form.form_name];
    await execute(
      `INSERT INTO case_forms (case_id, form_name, agency, description, url, deadline, notes, fees, processing_time, prerequisites, online_only, pdf_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        pdfSource?.pdf_url ?? null,
      ]
    );
  }

  await generateDeadlinesForCase(caseId);
  return caseId;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing 'text' field" },
        { status: 400 }
      );
    }

    const searchCheck = await checkAndIncrementSearch(userId);
    if (!searchCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: searchCheck.reason,
        upgrade_required: true,
        searches_used: searchCheck.searches_used,
        searches_limit: searchCheck.searches_limit,
      }, { status: 403 });
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
        await addLifeEvent(topEvent);
      } catch (aiError) {
        void aiError;
        await logSearch(userId, text, null, true, false);
        return NextResponse.json({
          success: false,
          error:
            "We couldn't find forms for that request. Make sure your ANTHROPIC_API_KEY is set and try again.",
        });
      }
    }

    const caseId = await createCaseFromEvent(topEvent, text, userId);
    await logSearch(userId, text, topEvent.event, aiGenerated, true);

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
