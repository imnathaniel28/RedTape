"use client";

import { useEffect, useState } from "react";
import { CaseCard } from "@/components/CaseCard";
import { DeadlineBanner } from "@/components/DeadlineBanner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CaseData {
  id: number;
  life_event: string;
  description: string | null;
  state: string;
  total_forms: number;
  completed_forms: number;
  in_progress_forms: number;
  submitted_forms: number;
  next_deadline: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cases")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCases(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeCases = cases.filter((c) => c.state === "active");
  const completedCases = cases.filter((c) => c.state !== "active");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <DeadlineBanner />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Your Cases</h1>
        <Link href="/">
          <Button className="bg-navy hover:bg-navy-light text-white">
            + New Case
          </Button>
        </Link>
      </div>

      {!loading && activeCases.length > 0 && (
        <DashboardStats cases={activeCases} />
      )}

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Loading...</p>
      ) : cases.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-lg text-muted-foreground">No cases yet.</p>
          <p className="text-sm text-muted-foreground">
            Go to the{" "}
            <Link href="/" className="text-navy underline">
              home page
            </Link>{" "}
            and describe a life event to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeCases.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Active ({activeCases.length})
              </h2>
              <div className="grid gap-3">
                {activeCases.map((c) => (
                  <CaseCard key={c.id} {...c} />
                ))}
              </div>
            </section>
          )}

          {completedCases.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Completed / Archived ({completedCases.length})
              </h2>
              <div className="grid gap-3">
                {completedCases.map((c) => (
                  <CaseCard key={c.id} {...c} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function DashboardStats({ cases }: { cases: CaseData[] }) {
  const totalForms = cases.reduce((s, c) => s + c.total_forms, 0);
  const completedForms = cases.reduce((s, c) => s + c.completed_forms, 0);
  const inProgressForms = cases.reduce((s, c) => s + c.in_progress_forms, 0);
  const submittedForms = cases.reduce((s, c) => s + c.submitted_forms, 0);
  const pct = totalForms > 0 ? Math.round((completedForms / totalForms) * 100) : 0;

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      <StatBox label="Total Forms" value={totalForms} />
      <StatBox label="Completed" value={completedForms} accent="text-green-600" />
      <StatBox label="In Progress" value={inProgressForms} accent="text-amber-600" />
      <StatBox label="Overall" value={`${pct}%`} accent="text-navy" />
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-3 text-center">
      <p className={`text-xl font-bold ${accent ?? ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
