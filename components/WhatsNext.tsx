"use client";

import { Badge } from "@/components/ui/badge";

interface CaseForm {
  id: number;
  form_name: string;
  agency: string;
  status: string;
  is_blocked: boolean;
  blocked_by: string[];
  fees: string | null;
  processing_time: string | null;
  pdf_url: string | null;
  online_only: number;
  pdf_filled: number;
}

interface Suggestion {
  type: "action" | "info" | "milestone";
  priority: number;
  title: string;
  detail: string;
  formId?: number;
}

function generateSuggestions(forms: CaseForm[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  const completed = forms.filter((f) => f.status === "completed");
  const inProgress = forms.filter((f) => f.status === "in_progress");
  const submitted = forms.filter((f) => f.status === "submitted");
  const ready = forms.filter(
    (f) => f.status === "not_started" && !f.is_blocked
  );
  const blocked = forms.filter(
    (f) => f.status === "not_started" && f.is_blocked
  );

  // Milestone: all done
  if (completed.length === forms.length) {
    suggestions.push({
      type: "milestone",
      priority: 0,
      title: "All forms complete!",
      detail: "You've finished every form for this life event. You can mark this case as completed.",
    });
    return suggestions;
  }

  // Next actionable forms
  for (const form of ready.slice(0, 2)) {
    const hasPdf = !!form.pdf_url && !form.online_only;
    suggestions.push({
      type: "action",
      priority: 1,
      title: `Start: ${form.form_name}`,
      detail: hasPdf
        ? `Ready to fill — use the "Fill PDF" button to auto-populate with your profile data.`
        : form.online_only
          ? `Complete online at the agency website.`
          : `Download or pick up this form from ${form.agency}.`,
      formId: form.id,
    });
  }

  // Follow up on submitted forms
  for (const form of submitted.slice(0, 2)) {
    suggestions.push({
      type: "info",
      priority: 2,
      title: `Check status: ${form.form_name}`,
      detail: form.processing_time
        ? `Processing time: ${form.processing_time}. Follow up with ${form.agency} if overdue.`
        : `Follow up with ${form.agency} to confirm receipt.`,
      formId: form.id,
    });
  }

  // Unblock hint
  if (blocked.length > 0 && ready.length === 0 && inProgress.length === 0) {
    const blocker = blocked[0].blocked_by[0];
    const blockerForm = forms.find((f) => f.form_name === blocker);
    if (blockerForm && blockerForm.status !== "completed") {
      suggestions.push({
        type: "action",
        priority: 1,
        title: `Unblock progress: Complete ${blocker}`,
        detail: `${blocked.length} form${blocked.length > 1 ? "s" : ""} are waiting on this. Completing it will unlock your next steps.`,
        formId: blockerForm.id,
      });
    }
  }

  // Progress milestone
  const pct = Math.round((completed.length / forms.length) * 100);
  if (pct > 0 && pct < 100) {
    suggestions.push({
      type: "milestone",
      priority: 10,
      title: `${pct}% complete — ${completed.length} of ${forms.length} forms done`,
      detail:
        inProgress.length > 0
          ? `${inProgress.length} in progress, ${ready.length} ready to start.`
          : `${ready.length} ready to start.`,
    });
  }

  return suggestions.sort((a, b) => a.priority - b.priority);
}

const TYPE_STYLES: Record<string, string> = {
  action: "border-l-4 border-l-navy bg-blue-50/50",
  info: "border-l-4 border-l-amber-400 bg-amber-50/50",
  milestone: "border-l-4 border-l-green-500 bg-green-50/50",
};

const TYPE_LABELS: Record<string, string> = {
  action: "Next Step",
  info: "Follow Up",
  milestone: "Progress",
};

export function WhatsNext({ forms }: { forms: CaseForm[] }) {
  const suggestions = generateSuggestions(forms);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">What&apos;s Next</h2>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${TYPE_STYLES[s.type]}`}
          >
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {TYPE_LABELS[s.type]}
              </Badge>
              <span className="font-medium text-sm">{s.title}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{s.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
