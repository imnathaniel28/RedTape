import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFSignature } from "pdf-lib";

export interface PdfFormField {
  name: string;
  type: "text" | "checkbox" | "dropdown" | "radio" | "signature" | "unknown";
  options?: string[];
  maxLength?: number;
}

export async function extractFormFields(
  pdfBytes: Uint8Array
): Promise<PdfFormField[]> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = doc.getForm();
  const rawFields = form.getFields();

  return rawFields.map((field) => {
    const name = field.getName();

    if (field instanceof PDFTextField) {
      return {
        name,
        type: "text" as const,
        maxLength: field.getMaxLength() ?? undefined,
      };
    }
    if (field instanceof PDFCheckBox) {
      return { name, type: "checkbox" as const };
    }
    if (field instanceof PDFDropdown) {
      return {
        name,
        type: "dropdown" as const,
        options: field.getOptions(),
      };
    }
    if (field instanceof PDFRadioGroup) {
      return {
        name,
        type: "radio" as const,
        options: field.getOptions(),
      };
    }
    if (field instanceof PDFSignature) {
      return { name, type: "signature" as const };
    }
    return { name, type: "unknown" as const };
  });
}

export function isXfaForm(pdfBytes: Uint8Array): boolean {
  // XFA forms contain an /XFA key in the AcroForm dictionary.
  // Quick heuristic: search for the XFA marker in raw bytes.
  const text = new TextDecoder("latin1").decode(pdfBytes.slice(0, 4096));
  return text.includes("/XFA");
}
