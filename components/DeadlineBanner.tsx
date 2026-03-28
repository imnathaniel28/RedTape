"use client";

import { useEffect, useState } from "react";

interface Deadline {
  id: number;
  case_id: number;
  title: string;
  due_date: string;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatUrgency(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue`;
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
}

export function DeadlineBanner() {
  const [urgent, setUrgent] = useState<Deadline[]>([]);

  useEffect(() => {
    fetch("/api/deadlines")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setUrgent(json.data.urgent);
      })
      .catch(() => {});
  }, []);

  if (urgent.length === 0) return null;

  const overdue = urgent.filter((d) => daysUntil(d.due_date) < 0);
  const upcoming = urgent.filter((d) => daysUntil(d.due_date) >= 0);

  return (
    <div className="max-w-3xl mx-auto px-4">
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <p className="text-sm font-semibold text-red-800">
            {overdue.length} overdue deadline{overdue.length !== 1 ? "s" : ""}
          </p>
          <ul className="mt-1 space-y-0.5">
            {overdue.map((d) => (
              <li key={d.id} className="text-xs text-red-700">
                {d.title} &mdash; {formatUrgency(daysUntil(d.due_date))}
              </li>
            ))}
          </ul>
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
          <p className="text-sm font-semibold text-amber-800">
            {upcoming.length} deadline{upcoming.length !== 1 ? "s" : ""} coming up this week
          </p>
          <ul className="mt-1 space-y-0.5">
            {upcoming.map((d) => (
              <li key={d.id} className="text-xs text-amber-700">
                {d.title} &mdash; {formatUrgency(daysUntil(d.due_date))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
