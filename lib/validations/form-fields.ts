import { z } from "zod";

export const ssnLast4Schema = z
  .string()
  .regex(/^\d{4}$/, "Must be exactly 4 digits");

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-().+]+$/, "Invalid phone format");

export const zipSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, "ZIP must be 5 or 9 digits");

export const emailSchema = z.string().email("Invalid email address");

export const stateAbbrevSchema = z
  .string()
  .length(2, "State must be 2-letter abbreviation")
  .toUpperCase();

export const userProfileSchema = z.object({
  full_name: z.string().min(1).nullable(),
  date_of_birth: isoDateSchema.nullable(),
  ssn_last4: ssnLast4Schema.nullable(),
  address_street: z.string().nullable(),
  address_city: z.string().nullable(),
  address_state: stateAbbrevSchema.nullable(),
  address_zip: zipSchema.nullable(),
  phone: phoneSchema.nullable(),
  email: emailSchema.nullable(),
  drivers_license: z.string().nullable(),
});

export function validateProfileForFill(profile: Record<string, unknown>): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (!profile.full_name) warnings.push("Name is missing — name fields will be left blank");
  if (!profile.date_of_birth) warnings.push("Date of birth is missing");
  if (!profile.ssn_last4) warnings.push("SSN last 4 is missing — SSN fields will show XXX-XX-XXXX");
  if (!profile.address_street) warnings.push("Address is incomplete");

  return { valid: warnings.length === 0, warnings };
}
