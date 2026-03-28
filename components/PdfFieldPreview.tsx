"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface PdfFormField {
  name: string;
  type: string;
  options?: string[];
}

interface PdfFieldPreviewProps {
  open: boolean;
  onClose: () => void;
  formName: string;
  fields: PdfFormField[];
  suggestedMapping: Record<string, string>;
  profileWarnings: string[];
  onConfirm: (overrides: Record<string, string>) => void;
  loading: boolean;
}

export function PdfFieldPreview({
  open,
  onClose,
  formName,
  fields,
  suggestedMapping,
  profileWarnings,
  onConfirm,
  loading,
}: PdfFieldPreviewProps) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const getValue = (fieldName: string) =>
    overrides[fieldName] ?? suggestedMapping[fieldName] ?? "";

  const mappedCount = fields.filter(
    (f) => getValue(f.name).length > 0
  ).length;

  function handleOverride(fieldName: string, value: string) {
    setOverrides((prev) => ({ ...prev, [fieldName]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-navy">Review: {formName}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {mappedCount} of {fields.length} fields pre-filled. Review and edit before generating PDF.
          </p>
        </DialogHeader>

        {profileWarnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm space-y-1">
            {profileWarnings.map((w, i) => (
              <p key={i} className="text-amber-800">&#9888; {w}</p>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {fields.filter((f) => f.type !== "signature").map((field) => (
            <div key={field.name} className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <Label className="text-xs font-mono text-muted-foreground truncate block">
                  {field.name}
                </Label>
                {field.type === "checkbox" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      checked={getValue(field.name) === "true"}
                      onChange={(e) =>
                        handleOverride(field.name, e.target.checked ? "true" : "false")
                      }
                    />
                    <span className="text-sm">{getValue(field.name) === "true" ? "Checked" : "Unchecked"}</span>
                  </div>
                ) : field.type === "dropdown" && field.options ? (
                  <select
                    className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
                    value={getValue(field.name)}
                    onChange={(e) => handleOverride(field.name, e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    className="mt-1 text-sm"
                    value={getValue(field.name)}
                    onChange={(e) => handleOverride(field.name, e.target.value)}
                    placeholder="(empty)"
                  />
                )}
              </div>
              <Badge variant="secondary" className="mt-5 text-xs shrink-0">
                {field.type}
              </Badge>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(overrides)} disabled={loading}>
            {loading ? "Generating PDF..." : "Generate Filled PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
