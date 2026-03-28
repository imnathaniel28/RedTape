import { z } from "zod";

export const fillPdfRequestSchema = z.object({
  form_id: z.number().int().positive(),
  overrides: z.record(z.string(), z.string()).optional(),
});

export const pdfFieldsRequestSchema = z.object({
  form_id: z.number().int().positive(),
});

export const uploadPdfRequestSchema = z.object({
  form_id: z.number().int().positive(),
});

export const analyzeRequestSchema = z.object({
  text: z.string().min(1, "Text is required"),
});

export const updateFormStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["not_started", "in_progress", "submitted", "completed"]),
  notes: z.string().optional(),
});
