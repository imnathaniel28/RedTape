import { getAnthropicClient } from "./client";
import type { LifeEvent } from "../form-registry";

/**
 * Uses Claude to research what government forms are needed for a life event
 * that doesn't match any existing template.
 */
export async function researchLifeEvent(
  description: string
): Promise<LifeEvent> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a government paperwork expert. A user described a life event or situation they need help with:

"${description}"

Identify every government form, registration, or filing they likely need across federal, state, and local agencies. Be thorough — include forms people commonly forget.

Respond with ONLY valid JSON matching this exact structure (no markdown, no explanation):

{
  "event": "snake_case_identifier",
  "label": "Short Human-Readable Title",
  "description": "One sentence describing this life event",
  "forms": [
    {
      "form_name": "Official form name or process name",
      "agency": "Government agency that handles this",
      "description": "What this form does and why you need it",
      "url": "Official agency URL for this form or process",
      "deadline": "When this must be filed (e.g. 'within 30 days', 'as soon as possible')",
      "online_only": false,
      "fees": "Filing fees if any, or 'Free'",
      "processing_time": "How long it takes to process",
      "prerequisites": "What you need before filing this",
      "notes": "Any important tips or gotchas"
    }
  ]
}

Rules:
- Include 3-15 forms depending on complexity
- Use real agency names and real form numbers where they exist
- URLs should point to real .gov pages when possible
- Sort forms by urgency (most time-sensitive first)
- Include federal, state, and local forms as applicable
- If the situation is state-specific, note that in form descriptions`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse the JSON response, stripping any markdown fencing
  const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  const parsed = JSON.parse(cleaned) as LifeEvent;

  // Validate minimum structure
  if (!parsed.event || !parsed.label || !Array.isArray(parsed.forms)) {
    throw new Error("AI returned invalid life event structure");
  }

  // Ensure all form fields have defaults
  parsed.forms = parsed.forms.map((form) => ({
    form_name: form.form_name ?? "Unknown Form",
    agency: form.agency ?? "Unknown Agency",
    description: form.description ?? "",
    url: form.url ?? "",
    deadline: form.deadline ?? "",
    online_only: form.online_only ?? false,
    fees: form.fees ?? undefined,
    processing_time: form.processing_time ?? undefined,
    prerequisites: form.prerequisites ?? undefined,
    notes: form.notes ?? "",
  }));

  return parsed;
}
