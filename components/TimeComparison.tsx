"use client";

interface TimeComparisonProps {
  withoutMinutes: number;
  withMinutes: number;
  savedMinutes: number;
  savedPercent: number;
  painPoints: string[];
}

function formatTime(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

export function TimeComparison({
  withoutMinutes,
  withMinutes,
  savedMinutes,
  savedPercent,
  painPoints,
}: TimeComparisonProps) {
  const maxBar = withoutMinutes;

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <h3 className="font-semibold text-sm">Time Saved</h3>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Without Bureaucracy Buster</span>
            <span className="font-medium text-red-600">{formatTime(withoutMinutes)}</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-400 rounded-full"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">With Bureaucracy Buster</span>
            <span className="font-medium text-green-600">{formatTime(withMinutes)}</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-700"
              style={{ width: `${(withMinutes / maxBar) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="text-center py-2 bg-green-50 rounded-lg">
        <p className="text-2xl font-bold text-green-700">
          {formatTime(savedMinutes)} saved
        </p>
        <p className="text-xs text-green-600">{savedPercent}% faster</p>
      </div>

      {painPoints.length > 0 && (
        <div className="text-xs space-y-1">
          <p className="font-medium text-muted-foreground">What you skip:</p>
          <ul className="space-y-0.5 text-muted-foreground">
            {painPoints.map((p, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-green-500 shrink-0">&#10003;</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
