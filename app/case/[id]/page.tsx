"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FormChecklist } from "@/components/FormChecklist";
import { DeadlineTimeline } from "@/components/DeadlineTimeline";
import { WhatsNext } from "@/components/WhatsNext";
import { TimeComparison } from "@/components/TimeComparison";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

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

interface CaseDetail {
  id: number;
  life_event: string;
  description: string;
  state: string;
  created_at: string;
  forms: Array<{
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
  }>;
  deadlines: Array<{
    id: number;
    title: string;
    due_date: string;
    reminder_sent: number;
  }>;
  time_estimate: {
    withoutMinutes: number;
    withMinutes: number;
    savedMinutes: number;
    savedPercent: number;
    painPoints: string[];
  };
}

export default function CaseDetailPage() {
  const params = useParams();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/cases/${params.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCaseData(json.data);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-muted-foreground">
        Loading case...
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground mb-4">Case not found.</p>
        <Link href="/dashboard" className="text-navy underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to dashboard
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-navy">
            {EVENT_LABELS[caseData.life_event] ?? caseData.life_event}
          </h1>
          <Badge
            variant="secondary"
            className={
              caseData.state === "active"
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }
          >
            {caseData.state}
          </Badge>
        </div>
        {caseData.description && (
          <p className="text-muted-foreground">{caseData.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Created {new Date(caseData.created_at).toLocaleDateString()}
        </p>
      </div>

      <WhatsNext forms={caseData.forms} />

      <Separator />

      <FormChecklist forms={caseData.forms} caseId={caseData.id} onStatusChange={async () => {
        const res = await fetch(`/api/cases/${caseData.id}`);
        const json = await res.json();
        if (json.success) setCaseData(json.data);
      }} />

      <Separator />

      <DeadlineTimeline deadlines={caseData.deadlines} />

      <Separator />

      <TimeComparison {...caseData.time_estimate} />

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="text-sm"
          onClick={async () => {
            const res = await fetch(`/api/cases/${caseData.id}/export`);
            if (res.ok) {
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `case_${caseData.id}_audit_trail.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            }
          }}
        >
          Export Audit Trail (PDF)
        </Button>
        {caseData.forms.every((f) => f.status === "completed") && (
          <Button
            className="bg-navy hover:bg-navy-light text-white text-sm"
            onClick={() => {
              window.open(`/certificate/${caseData.id}`, "_blank");
            }}
          >
            View Completion Certificate
          </Button>
        )}
      </div>
    </div>
  );
}
