import { queryOne, execute } from "./db";

export interface UserProfile {
  id?: number;
  user_id?: string;
  full_name: string | null;
  date_of_birth: string | null;
  ssn_last4: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  phone: string | null;
  email: string | null;
  drivers_license: string | null;
}

export async function getUserProfile(userId: string): Promise<UserProfile | undefined> {
  return queryOne<UserProfile>(
    "SELECT * FROM user_profile WHERE user_id = ?",
    [userId]
  );
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Omit<UserProfile, "id" | "user_id">>
): Promise<UserProfile | undefined> {
  const fields = Object.keys(data).filter((k) => k !== "id" && k !== "user_id");
  if (fields.length === 0) return getUserProfile(userId);

  // Try to update existing row first
  const sets = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) => (data as Record<string, unknown>)[f]);
  const result = await execute(
    `UPDATE user_profile SET ${sets} WHERE user_id = ?`,
    [...values, userId]
  );

  if (result.rowsAffected === 0) {
    // No row exists yet — insert a new one
    const cols = ["user_id", ...fields].join(", ");
    const placeholders = ["?", ...fields.map(() => "?")].join(", ");
    await execute(
      `INSERT INTO user_profile (${cols}) VALUES (${placeholders})`,
      [userId, ...values]
    );
  }

  return getUserProfile(userId);
}

export interface PrefillData {
  [fieldName: string]: string;
}

export async function generatePrefillData(formName: string, userId: string): Promise<PrefillData> {
  const profile = await getUserProfile(userId);
  const data: PrefillData = {};

  if (!profile) return data;

  // Common field mappings
  if (profile.full_name) {
    data["Full Name"] = profile.full_name;
    const parts = profile.full_name.split(" ");
    if (parts.length >= 2) {
      data["First Name"] = parts[0];
      data["Last Name"] = parts[parts.length - 1];
      if (parts.length > 2) {
        data["Middle Name"] = parts.slice(1, -1).join(" ");
      }
    }
  }

  if (profile.date_of_birth) {
    data["Date of Birth"] = profile.date_of_birth;
  }

  // SSN — only last 4, with placeholder for safety
  if (profile.ssn_last4) {
    data["SSN"] = `XXX-XX-${profile.ssn_last4}`;
  }

  if (profile.address_street) data["Street Address"] = profile.address_street;
  if (profile.address_city) data["City"] = profile.address_city;
  if (profile.address_state) data["State"] = profile.address_state;
  if (profile.address_zip) data["ZIP Code"] = profile.address_zip;
  if (profile.phone) data["Phone"] = profile.phone;
  if (profile.email) data["Email"] = profile.email;
  if (profile.drivers_license) data["Driver's License"] = profile.drivers_license;

  void formName;
  return data;
}
