"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PdfFillButton } from "./PdfFillButton";

interface CaseForm {
  id: number;
  form_name: string;
  agency: string;
  description: string;
  url: string;
  status: string;
  notes: string | null;
  fees: string | null;
  processing_time: string | null;
  prerequisites: string | null;
  online_only: number;
  pdf_url: string | null;
  pdf_filled: number;
  is_blocked: boolean;
  blocked_by: string[];
  depends_on: string[];
}

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700",
  in_progress: "bg-amber-100 text-amber-800",
  submitted: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  completed: "Completed",
};

const STATUS_ORDER = ["not_started", "in_progress", "submitted", "completed"];

export function FormChecklist({ forms: initialForms, caseId, onStatusChange }: { forms: CaseForm[]; caseId?: number; onStatusChange?: () => Promise<void> }) {
  const [forms, setForms] = useState(initialForms);

  useEffect(() => {
    setForms(initialForms);
  }, [initialForms]);

  async function cycleStatus(formId: number, currentStatus: string) {
    const currentIdx = STATUS_ORDER.indexOf(currentStatus);
    const nextStatus = STATUS_ORDER[(currentIdx + 1) % STATUS_ORDER.length];

    const res = await fetch("/api/forms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: formId, status: nextStatus }),
    });
    const json = await res.json();

    if (json.success) {
      if (onStatusChange) {
        await onStatusChange();
      } else {
        setForms((prev) =>
          prev.map((f) => (f.id === formId ? { ...f, status: nextStatus } : f))
        );
      }
    }
  }

  const completed = forms.filter((f) => f.status === "completed").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Forms ({completed}/{forms.length} complete)
        </h2>
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-complete rounded-full transition-all duration-300"
            style={{
              width: `${forms.length > 0 ? (completed / forms.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {forms.map((form) => (
          <div
            key={form.id}
            className={`flex items-start gap-3 p-3 rounded-lg border bg-white hover:shadow-sm transition-shadow ${
              form.is_blocked ? "opacity-60" : ""
            }`}
          >
            <Checkbox
              checked={form.status === "completed"}
              onCheckedChange={() => cycleStatus(form.id, form.status)}
              className="mt-0.5"
              disabled={form.is_blocked}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{form.form_name}</span>
                <Badge
                  variant="secondary"
                  className={`text-xs cursor-pointer ${STATUS_COLORS[form.status]}`}
                  onClick={() => !form.is_blocked && cycleStatus(form.id, form.status)}
                >
                  {STATUS_LABELS[form.status]}
                </Badge>
                {form.is_blocked && (
                  <Badge variant="secondary" className="text-xs bg-red-50 text-red-700">
                    Blocked
                  </Badge>
                )}
              </div>
              {form.is_blocked && form.blocked_by.length > 0 && (
                <p className="text-xs text-red-600 mt-0.5">
                  Waiting on: {form.blocked_by.join(", ")}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {form.agency}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {form.description}
              </p>
              {(form.fees || form.processing_time || form.prerequisites) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                  {form.fees && (
                    <span>
                      <span className="font-medium text-foreground">Fee:</span>{" "}
                      {form.fees}
                    </span>
                  )}
                  {form.processing_time && (
                    <span>
                      <span className="font-medium text-foreground">Time:</span>{" "}
                      {form.processing_time}
                    </span>
                  )}
                </div>
              )}
              {form.prerequisites && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">Docs needed:</span>{" "}
                  {form.prerequisites}
                </p>
              )}
              {form.url && (
                <a
                  href={form.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-navy hover:underline mt-1.5 inline-block"
                >
                  Open form &rarr;
                </a>
              )}
              <PdfFillButton
                formId={form.id}
                formName={form.form_name}
                hasPdfUrl={!!form.pdf_url}
                onlineOnly={!!form.online_only}
                pdfFilled={!!form.pdf_filled}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
