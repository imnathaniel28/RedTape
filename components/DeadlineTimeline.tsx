"use client";

interface Deadline {
  id: number;
  title: string;
  due_date: string;
  reminder_sent: number;
}

function getDeadlineClass(dueDate: string): string {
  const now = new Date();
  const due = new Date(dueDate);
  const daysUntil = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntil < 0) return "deadline-overdue";
  if (daysUntil < 7) return "deadline-urgent";
  if (daysUntil <= 30) return "deadline-warning";
  return "deadline-safe";
}

function getDeadlineLabel(dueDate: string): string {
  const now = new Date();
  const due = new Date(dueDate);
  const daysUntil = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
  if (daysUntil === 0) return "Due today";
  if (daysUntil === 1) return "Due tomorrow";
  return `${daysUntil} days left`;
}

export function DeadlineTimeline({ deadlines }: { deadlines: Deadline[] }) {
  if (deadlines.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No deadlines set yet. Deadlines will appear as you work through your
        forms.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Deadlines</h2>
      <div className="space-y-2">
        {deadlines.map((dl) => (
          <div
            key={dl.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-white"
          >
            <div>
              <p className="text-sm font-medium">{dl.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(dl.due_date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <span
              className={`text-sm font-semibold ${getDeadlineClass(dl.due_date)}`}
            >
              {getDeadlineLabel(dl.due_date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
