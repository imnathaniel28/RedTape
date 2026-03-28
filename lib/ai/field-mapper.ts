import { getAnthropicClient } from "./client";
import type { UserProfile } from "../prefiller";
import type { PdfFormField } from "../pdf/field-extractor";

export interface FieldMapping {
  [pdfFieldName: string]: string;
}

export async function mapFieldsWithClaude(
  formName: string,
  fields: PdfFormField[],
  profile: UserProfile
): Promise<FieldMapping> {
  const client = getAnthropicClient();

  const profileData: Record<string, string> = {};
  if (profile.full_name) {
    profileData.full_name = profile.full_name;
    const parts = profile.full_name.split(" ");
    if (parts.length >= 2) {
      profileData.first_name = parts[0];
      profileData.last_name = parts[parts.length - 1];
      if (parts.length > 2) {
        profileData.middle_name = parts.slice(1, -1).join(" ");
      }
    }
  }
  if (profile.date_of_birth) profileData.date_of_birth = profile.date_of_birth;
  if (profile.ssn_last4) profileData.ssn_last4 = profile.ssn_last4;
  if (profile.address_street) profileData.address_street = profile.address_street;
  if (profile.address_city) profileData.address_city = profile.address_city;
  if (profile.address_state) profileData.address_state = profile.address_state;
  if (profile.address_zip) profileData.address_zip = profile.address_zip;
  if (profile.phone) profileData.phone = profile.phone;
  if (profile.email) profileData.email = profile.email;
  if (profile.drivers_license) profileData.drivers_license = profile.drivers_license;

  const fieldDescriptions = fields.map((f) => ({
    name: f.name,
    type: f.type,
    options: f.options,
  }));

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `You are a government form filling assistant. You map user profile data to PDF form fields.

Rules:
- Return ONLY a JSON object mapping PDF field names to values.
- For SSN fields, use "XXX-XX-{last4}" since we only store the last 4 digits. The user must fill in the rest manually.
- For date fields, use MM/DD/YYYY format unless the field name suggests otherwise.
- For name fields, split full_name into first/middle/last as appropriate.
- For checkbox fields, return "true" or "false".
- For dropdown fields, pick the closest matching option from the available options.
- If you cannot determine a value for a field, omit it from the mapping.
- Do NOT invent or fabricate any data. Only use what is provided.`,
    messages: [
      {
        role: "user",
        content: `Form: ${formName}

PDF form fields:
${JSON.stringify(fieldDescriptions, null, 2)}

User data:
${JSON.stringify(profileData, null, 2)}

Return a JSON object mapping each PDF field name to the correct value. Only include fields you can confidently fill.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {};
  }

  try {
    return JSON.parse(jsonMatch[0]) as FieldMapping;
  } catch {
    return {};
  }
}
