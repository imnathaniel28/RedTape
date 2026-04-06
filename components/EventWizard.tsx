"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Red arrow pointing to input */}
      <div className="relative">
        <svg
          className="absolute -left-12 top-1/2 -translate-y-1/2 w-10 h-8 hidden md:block"
          viewBox="0 0 50 30"
          fill="none"
        >
          <path
            d="M5,15 Q15,14 30,15 T45,14"
            stroke="#c41919"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M36,8 L46,14 L37,21"
            stroke="#c41919"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>

        {/* Vintage paper textarea */}
        <textarea
          placeholder="e.g. I'm moving from California to Texas next month..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={loading}
          className="w-full min-h-[70px] text-lg p-4 rounded-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400/50 placeholder:text-gray-400"
          style={{
            background:
              "linear-gradient(135deg, #f5f0e0 0%, #ede7d0 50%, #e8e0c8 100%)",
            border: "1px solid #c8b88a",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.06)",
            transform: "rotate(-0.3deg)",
          }}
        />
      </div>

      {/* "Find My Forms" button */}
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || loading}
        className="w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] bg-transparent border-none p-0"
      >
        <Image
          src="/find.png"
          alt={loading ? "Researching your forms..." : "Find My Forms"}
          width={780}
          height={80}
          className="w-full h-auto"
        />
      </button>

      {error && (
        <p className="text-red-600 text-sm text-center font-medium">
          {error}
        </p>
      )}

      {/* "Or try one of these" image with clickable hotspots */}
      <div className="pt-3 w-full max-w-xl mx-auto">
        <div className="relative">
          <Image
            src="/try_Links.png"
            alt="Or try one of these: Get married, File taxes, Change jobs"
            width={854}
            height={207}
            className="w-full h-auto"
          />
          {/* Invisible clickable hotspots over each button */}
          <button
            onClick={() => setText("Getting married")}
            className="absolute cursor-pointer hover:bg-white/10 active:bg-white/20 transition-colors rounded"
            style={{ left: '5%', top: '35%', width: '27%', height: '50%' }}
            aria-label="Get married"
          />
          <button
            onClick={() => setText("Filing taxes")}
            className="absolute cursor-pointer hover:bg-white/10 active:bg-white/20 transition-colors rounded"
            style={{ left: '36%', top: '35%', width: '24%', height: '50%' }}
            aria-label="File taxes"
          />
          <button
            onClick={() => setText("Changing jobs")}
            className="absolute cursor-pointer hover:bg-white/10 active:bg-white/20 transition-colors rounded"
            style={{ left: '64%', top: '35%', width: '26%', height: '50%' }}
            aria-label="Change jobs"
          />
        </div>
      </div>
    </div>
  );
}
