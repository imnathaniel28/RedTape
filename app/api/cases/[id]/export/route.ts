import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { queryOne, queryAll } from "@/lib/db";
import { getTimeEstimate, formatMinutes } from "@/lib/time-estimates";

const EVENT_LABELS: Record<string, string> = {
  moving_to_new_state: "Moving to a New State",
  having_a_baby: "Having a Baby",
  getting_married: "Getting Married",
  death_of_family_member: "Death of a Family Member",
  starting_a_small_business: "Starting a Small Business",
  buying_a_house: "Buying a House",
  getting_divorced: "Getting Divorced",
  retiring: "Retiring",
  immigration_green_card: "Immigration / Green Card",
  child_starting_school: "Child Starting School",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  completed: "Completed",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const caseData = await queryOne<{
    id: number;
    life_event: string;
    description: string;
    state: string;
    created_at: string;
    user_id: string | null;
  }>("SELECT * FROM cases WHERE id = ?", [id]);

  if (!caseData) {
    return new Response("Case not found", { status: 404 });
  }

  if (caseData.user_id !== userId) {
    return new Response("Forbidden", { status: 403 });
  }

  const forms = await queryAll<{
    form_name: string;
    agency: string;
    status: string;
    fees: string | null;
    processing_time: string | null;
    created_at: string;
  }>("SELECT * FROM case_forms WHERE case_id = ? ORDER BY id", [id]);

  const deadlines = await queryAll<{
    title: string;
    due_date: string;
  }>("SELECT * FROM deadlines WHERE case_id = ? ORDER BY due_date", [id]);

  const timeEst = getTimeEstimate(caseData.life_event);

  // Build PDF
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.102, 0.212, 0.365);
  const gray = rgb(0.4, 0.4, 0.4);
  const black = rgb(0, 0, 0);
  const green = rgb(0.22, 0.63, 0.41);

  let page = doc.addPage([612, 792]);
  let y = 740;
  const margin = 50;
  const width = 612 - margin * 2;

  function checkPage() {
    if (y < 80) {
      page = doc.addPage([612, 792]);
      y = 740;
    }
  }

  function drawText(text: string, x: number, yPos: number, options: {
    font?: typeof font;
    size?: number;
    color?: typeof navy;
    maxWidth?: number;
  } = {}) {
    const f = options.font ?? font;
    const size = options.size ?? 10;
    const color = options.color ?? black;

    if (options.maxWidth) {
      const words = text.split(" ");
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (f.widthOfTextAtSize(test, size) > options.maxWidth && line) {
          page.drawText(line, { x, y: yPos, font: f, size, color });
          yPos -= size + 4;
          checkPage();
          line = word;
        } else {
          line = test;
        }
      }
      if (line) {
        page.drawText(line, { x, y: yPos, font: f, size, color });
        yPos -= size + 4;
      }
      return yPos;
    }

    page.drawText(text, { x, y: yPos, font: f, size, color });
    return yPos - size - 4;
  }

  // Header
  y = drawText("REDTAPE", margin, y, { font: fontBold, size: 20, color: navy });
  y = drawText("Case Audit Trail", margin, y, { font: fontBold, size: 14, color: gray });
  y -= 10;

  // Divider
  page.drawLine({ start: { x: margin, y }, end: { x: margin + width, y }, thickness: 1, color: navy });
  y -= 20;

  // Case Info
  const label = EVENT_LABELS[caseData.life_event] ?? caseData.life_event;
  y = drawText(`Life Event: ${label}`, margin, y, { font: fontBold, size: 11 });
  if (caseData.description) {
    y = drawText(`Description: ${caseData.description}`, margin, y, { size: 10, color: gray, maxWidth: width });
  }
  y = drawText(`Status: ${caseData.state}`, margin, y, { size: 10 });
  y = drawText(`Created: ${new Date(caseData.created_at).toLocaleDateString()}`, margin, y, { size: 10 });
  y = drawText(`Exported: ${new Date().toLocaleDateString()}`, margin, y, { size: 10 });
  y -= 10;

  // Time Saved
  const completed = forms.filter((f) => f.status === "completed").length;
  y = drawText("Time Analysis", margin, y, { font: fontBold, size: 12, color: navy });
  y = drawText(`Estimated without help: ${formatMinutes(timeEst.withoutMinutes)}`, margin, y, { size: 10 });
  y = drawText(`Estimated with RedTape: ${formatMinutes(timeEst.withMinutes)}`, margin, y, { size: 10, color: green });
  y = drawText(`Time saved: ${formatMinutes(timeEst.savedMinutes)} (${timeEst.savedPercent}%)`, margin, y, { font: fontBold, size: 10, color: green });
  y -= 15;

  // Forms
  checkPage();
  y = drawText(`Forms (${completed}/${forms.length} complete)`, margin, y, { font: fontBold, size: 12, color: navy });
  y -= 5;

  for (const form of forms) {
    checkPage();
    const statusLabel = STATUS_LABELS[form.status] ?? form.status;
    y = drawText(`${form.form_name}`, margin, y, { font: fontBold, size: 10 });
    y = drawText(`  Agency: ${form.agency}  |  Status: ${statusLabel}`, margin, y, { size: 9, color: gray });
    if (form.fees) {
      y = drawText(`  Fees: ${form.fees}`, margin, y, { size: 9, color: gray });
    }
    y -= 5;
  }

  // Deadlines
  if (deadlines.length > 0) {
    checkPage();
    y -= 10;
    y = drawText(`Deadlines (${deadlines.length})`, margin, y, { font: fontBold, size: 12, color: navy });
    y -= 5;

    for (const dl of deadlines) {
      checkPage();
      const dateStr = new Date(dl.due_date).toLocaleDateString();
      y = drawText(`${dl.title} — ${dateStr}`, margin, y, { size: 10 });
    }
  }

  // Footer on last page
  page.drawLine({ start: { x: margin, y: 50 }, end: { x: margin + width, y: 50 }, thickness: 0.5, color: gray });
  page.drawText("Generated by RedTape — Never auto-submits. Always review before filing.", {
    x: margin,
    y: 35,
    font,
    size: 7,
    color: gray,
  });

  const pdfBytes = await doc.save();

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="case_${id}_audit_trail.pdf"`,
    },
  });
}
