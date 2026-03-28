"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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

const EVENT_EMOJIS: Record<string, string> = {
  moving_to_new_state: "🏠",
  having_a_baby: "👶",
  getting_married: "💍",
  death_of_family_member: "🕊️",
  starting_a_small_business: "🏢",
  buying_a_house: "🏡",
  getting_divorced: "📋",
  retiring: "🎉",
  immigration_green_card: "🗽",
  child_starting_school: "🎒",
};

interface CertData {
  life_event: string;
  created_at: string;
  formCount: number;
  timeSaved: string;
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} minutes`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h} hour${h !== 1 ? "s" : ""}`;
  return `${h}h ${m}m`;
}

export default function CertificatePage() {
  const params = useParams();
  const [data, setData] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/cases/${params.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const d = json.data;
          setData({
            life_event: d.life_event,
            created_at: d.created_at,
            formCount: d.forms.length,
            timeSaved: formatMinutes(d.time_estimate.savedMinutes),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Certificate not found.</p>
      </div>
    );
  }

  const label = EVENT_LABELS[data.life_event] ?? data.life_event;
  const emoji = EVENT_EMOJIS[data.life_event] ?? "📜";
  const completedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex gap-3 print:hidden">
          <Link href={`/case/${params.id}`}>
            <Button variant="outline" size="sm">
              &larr; Back to case
            </Button>
          </Link>
          <Button size="sm" onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </div>

        <div
          ref={certRef}
          className="bg-white border-4 border-double border-navy rounded-lg p-10 text-center space-y-6 print:border-2"
        >
          <div className="text-6xl">{emoji}</div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Certificate of Completion
            </p>
            <h1 className="text-3xl font-bold text-navy">
              Bureaucracy Busted!
            </h1>
          </div>

          <div className="py-4 space-y-2">
            <p className="text-lg text-muted-foreground">
              Successfully navigated
            </p>
            <p className="text-2xl font-bold">{label}</p>
            <p className="text-muted-foreground">
              Completing{" "}
              <span className="font-semibold text-foreground">
                {data.formCount} government forms
              </span>{" "}
              and saving an estimated{" "}
              <span className="font-semibold text-green-600">
                {data.timeSaved}
              </span>
            </p>
          </div>

          <div className="flex justify-center gap-12 text-sm text-muted-foreground pt-4 border-t">
            <div>
              <p className="font-medium text-foreground">{completedDate}</p>
              <p>Date Completed</p>
            </div>
            <div>
              <p className="font-medium text-foreground">{data.formCount}</p>
              <p>Forms Filed</p>
            </div>
            <div>
              <p className="font-medium text-green-600">{data.timeSaved}</p>
              <p>Time Saved</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-6">
            Powered by Bureaucracy Buster
          </p>
        </div>
      </div>
    </div>
  );
}
