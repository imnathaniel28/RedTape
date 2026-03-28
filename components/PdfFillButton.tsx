"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PdfFieldPreview } from "./PdfFieldPreview";

interface PdfFillButtonProps {
  formId: number;
  formName: string;
  hasPdfUrl: boolean;
  onlineOnly: boolean;
  pdfFilled: boolean;
}

interface FieldsResponse {
  success: boolean;
  data?: {
    fields: Array<{ name: string; type: string; options?: string[] }>;
    suggestedMapping: Record<string, string>;
    profileWarnings: string[];
    formName: string;
  };
  error?: string;
}

export function PdfFillButton({
  formId,
  formName,
  hasPdfUrl,
  onlineOnly,
  pdfFilled,
}: PdfFillButtonProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fieldsData, setFieldsData] = useState<FieldsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filling, setFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  if (onlineOnly) return null;

  async function handlePreview() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pdf/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_id: formId }),
      });
      const json: FieldsResponse = await res.json();
      if (json.success && json.data) {
        setFieldsData(json.data);
        setPreviewOpen(true);
      } else {
        setError(json.error ?? "Failed to load form fields");
      }
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  }

  async function handleFill(overrides: Record<string, string>) {
    setFilling(true);
    try {
      const res = await fetch("/api/pdf/fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_id: formId, overrides }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${formName.replace(/[^a-zA-Z0-9.-]/g, "_")}_filled.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setPreviewOpen(false);
      } else {
        const json = await res.json();
        setError(json.error ?? "Fill failed");
      }
    } catch {
      setError("Failed to generate PDF");
    } finally {
      setFilling(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("form_id", String(formId));
      fd.append("file", file);
      const res = await fetch("/api/pdf/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) {
        handlePreview();
      } else {
        setError(json.error ?? "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5 mt-1.5">
        {hasPdfUrl ? (
          <Button
            size="sm"
            variant={pdfFilled ? "outline" : "default"}
            className="h-7 text-xs"
            onClick={handlePreview}
            disabled={loading}
          >
            {loading ? "Loading..." : pdfFilled ? "Re-fill PDF" : "Fill PDF"}
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => uploadRef.current?.click()}
              disabled={loading}
            >
              {loading ? "Processing..." : "Upload PDF"}
            </Button>
            <input
              ref={uploadRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleUpload}
            />
          </>
        )}
        {pdfFilled && (
          <span className="text-xs text-green-600 font-medium">Filled</span>
        )}
        {error && (
          <span className="text-xs text-red-600">{error}</span>
        )}
      </div>

      {fieldsData && (
        <PdfFieldPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          formName={fieldsData.formName}
          fields={fieldsData.fields}
          suggestedMapping={fieldsData.suggestedMapping}
          profileWarnings={fieldsData.profileWarnings}
          onConfirm={handleFill}
          loading={filling}
        />
      )}
    </>
  );
}
