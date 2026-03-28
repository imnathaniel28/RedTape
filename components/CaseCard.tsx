import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface CaseCardProps {
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

const STATE_BADGE: Record<string, string> = {
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-600",
};

function formatDeadline(dateStr: string): { text: string; className: string } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) return { text: `${Math.abs(days)}d overdue`, className: "text-red-600 font-semibold" };
  if (days === 0) return { text: "Due today", className: "text-red-600 font-semibold" };
  if (days <= 7) return { text: `${days}d left`, className: "text-amber-600 font-medium" };
  return {
    text: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    className: "text-muted-foreground",
  };
}

export function CaseCard({
  id,
  life_event,
  description,
  state,
  total_forms,
  completed_forms,
  in_progress_forms,
  submitted_forms,
  next_deadline,
  created_at,
}: CaseCardProps) {
  const progress =
    total_forms > 0 ? Math.round((completed_forms / total_forms) * 100) : 0;

  return (
    <Link href={`/case/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {EVENT_LABELS[life_event] ?? life_event}
            </CardTitle>
            <Badge variant="secondary" className={STATE_BADGE[state]}>
              {state}
            </Badge>
          </div>
          {description && (
            <CardDescription className="line-clamp-2">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                {completed_forms}/{total_forms} done
              </span>
              {in_progress_forms > 0 && (
                <span className="text-amber-600 text-xs">
                  {in_progress_forms} in progress
                </span>
              )}
              {submitted_forms > 0 && (
                <span className="text-blue-600 text-xs">
                  {submitted_forms} submitted
                </span>
              )}
            </div>
            {next_deadline ? (
              <span className={`text-xs ${formatDeadline(next_deadline).className}`}>
                {formatDeadline(next_deadline).text}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {new Date(created_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-complete rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
