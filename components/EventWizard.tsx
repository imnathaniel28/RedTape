"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLE_PILLS = [
  "Moving to Texas",
  "Just had a baby",
  "Starting an LLC",
  "Mom passed away",
  "Getting married",
  "Buying a house",
  "Getting divorced",
  "Retiring next month",
  "Applying for green card",
  "Enrolling kid in school",
];

export function EventWizard() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Analysis failed");
        return;
      }

      if (json.data.case_id) {
        router.push(`/case/${json.data.case_id}`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Textarea
        placeholder="e.g., I'm moving from California to Texas next month..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        className="min-h-[120px] text-lg resize-none border-2 focus:border-navy"
        disabled={loading}
      />

      <Button
        onClick={handleSubmit}
        disabled={!text.trim() || loading}
        className="w-full bg-navy hover:bg-navy-light text-white h-12 text-base font-medium"
      >
        {loading ? "Researching your forms..." : "Find My Forms"}
      </Button>

      {error && (
        <p className="text-red-urgent text-sm text-center">{error}</p>
      )}

      <div className="pt-4">
        <p className="text-sm text-muted-foreground text-center mb-3">
          Or try one of these:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLE_PILLS.map((pill) => (
            <button
              key={pill}
              onClick={() => setText(pill)}
              className="px-3 py-1.5 text-sm rounded-full border border-border bg-white hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              {pill}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
