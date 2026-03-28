"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Template {
  event: string;
  label: string;
  description: string;
  formCount: number;
  estimatedTime: number;
  timeSaved: number;
  savedPercent: number;
  agencies: string[];
}

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

function formatTime(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setTemplates(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function startFromTemplate(event: string, label: string) {
    setStarting(event);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `I need help with: ${label}` }),
      });
      const json = await res.json();
      if (json.success && json.data.case_id) {
        router.push(`/case/${json.data.case_id}`);
      }
    } finally {
      setStarting(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl font-bold text-navy">Life Event Templates</h1>
        <p className="text-muted-foreground">
          Browse all supported life events. Each template includes every form
          you need, organized by dependency order with pre-filled data from your
          profile.
        </p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Loading templates...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.event} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{EVENT_EMOJIS[t.event] ?? "📄"}</span>
                  <div className="flex-1">
                    <CardTitle className="text-base">{t.label}</CardTitle>
                    <CardDescription className="mt-1">
                      {t.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {t.formCount} forms
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                    ~{formatTime(t.estimatedTime)} with BB
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                    Saves {t.savedPercent}%
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Agencies: </span>
                  {t.agencies.slice(0, 4).join(", ")}
                  {t.agencies.length > 4 && ` +${t.agencies.length - 4} more`}
                </div>

                <Button
                  className="w-full bg-navy hover:bg-navy-light text-white"
                  size="sm"
                  disabled={starting === t.event}
                  onClick={() => startFromTemplate(t.event, t.label)}
                >
                  {starting === t.event ? "Creating case..." : "Start This Template"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
