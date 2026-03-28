import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown } from "pdf-lib";
import type { FieldMapping } from "../ai/field-mapper";

export async function fillPdfForm(
  pdfBytes: Uint8Array,
  mapping: FieldMapping
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = doc.getForm();

  for (const [fieldName, value] of Object.entries(mapping)) {
    try {
      const field = form.getField(fieldName);

      if (field instanceof PDFTextField) {
        field.setText(value);
      } else if (field instanceof PDFCheckBox) {
        const truthy = ["true", "yes", "on", "1", "checked"].includes(
          value.toLowerCase()
        );
        if (truthy) {
          field.check();
        } else {
          field.uncheck();
        }
      } else if (field instanceof PDFDropdown) {
        const options = field.getOptions();
        const match = options.find(
          (o) => o.toLowerCase() === value.toLowerCase()
        );
        if (match) {
          field.select(match);
        }
      }
    } catch {
      // Field not found or incompatible — skip
    }
  }

  return doc.save();
}
