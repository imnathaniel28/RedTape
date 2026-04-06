import { NextResponse } from "next/server";
import { getAllLifeEvents, hydrateFromDb } from "@/lib/form-registry";
import { getAllTimeEstimates } from "@/lib/time-estimates";

export async function GET() {
  try {
    await hydrateFromDb();
    const events = getAllLifeEvents();
    const timeEstimates = getAllTimeEstimates();

    const templates = events.map((e) => {
      const est = timeEstimates[e.event];
      return {
        event: e.event,
        label: e.label,
        description: e.description,
        formCount: e.forms.length,
        estimatedTime: est?.withMinutes ?? 60,
        timeSaved: est?.savedMinutes ?? 0,
        savedPercent: est?.savedPercent ?? 0,
        agencies: [...new Set(e.forms.map((f) => f.agency))],
      };
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
