import { getDb } from "./db";

export interface UserProfile {
  id: number;
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

export function getUserProfile(): UserProfile {
  const db = getDb();
  return db.prepare("SELECT * FROM user_profile WHERE id = 1").get() as UserProfile;
}

export function updateUserProfile(data: Partial<Omit<UserProfile, "id">>): UserProfile {
  const db = getDb();
  const fields = Object.keys(data).filter((k) => k !== "id");
  if (fields.length === 0) return getUserProfile();

  const sets = fields.map((f) => `${f} = @${f}`).join(", ");
  db.prepare(`UPDATE user_profile SET ${sets} WHERE id = 1`).run(data);
  return getUserProfile();
}

export interface PrefillData {
  [fieldName: string]: string;
}

export function generatePrefillData(formName: string): PrefillData {
  const profile = getUserProfile();
  const data: PrefillData = {};

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

  return data;
}
