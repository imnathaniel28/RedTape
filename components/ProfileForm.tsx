"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileData {
  full_name: string;
  date_of_birth: string;
  ssn_last4: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  phone: string;
  email: string;
  drivers_license: string;
}

const EMPTY_PROFILE: ProfileData = {
  full_name: "",
  date_of_birth: "",
  ssn_last4: "",
  address_street: "",
  address_city: "",
  address_state: "",
  address_zip: "",
  phone: "",
  email: "",
  drivers_license: "",
};

export function ProfileForm() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setProfile({
            full_name: json.data.full_name ?? "",
            date_of_birth: json.data.date_of_birth ?? "",
            ssn_last4: json.data.ssn_last4 ?? "",
            address_street: json.data.address_street ?? "",
            address_city: json.data.address_city ?? "",
            address_state: json.data.address_state ?? "",
            address_zip: json.data.address_zip ?? "",
            phone: json.data.phone ?? "",
            email: json.data.email ?? "",
            drivers_license: json.data.drivers_license ?? "",
          });
        }
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const json = await res.json();
      if (json.success) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function update(field: keyof ProfileData, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="full_name">Full Legal Name</Label>
          <Input
            id="full_name"
            value={profile.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            placeholder="John Michael Smith"
          />
        </div>

        <div>
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={profile.date_of_birth}
            onChange={(e) => update("date_of_birth", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="ssn">SSN (Last 4 only)</Label>
          <Input
            id="ssn"
            value={profile.ssn_last4}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
              update("ssn_last4", val);
            }}
            placeholder="1234"
            maxLength={4}
          />
          <p className="text-xs text-muted-foreground mt-1">
            We never store your full SSN. Only the last 4 digits.
          </p>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="street">Street Address</Label>
          <Input
            id="street"
            value={profile.address_street}
            onChange={(e) => update("address_street", e.target.value)}
            placeholder="123 Main St, Apt 4B"
          />
        </div>

        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={profile.address_city}
            onChange={(e) => update("address_city", e.target.value)}
            placeholder="Austin"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={profile.address_state}
              onChange={(e) =>
                update("address_state", e.target.value.toUpperCase().slice(0, 2))
              }
              placeholder="TX"
              maxLength={2}
            />
          </div>
          <div>
            <Label htmlFor="zip">ZIP</Label>
            <Input
              id="zip"
              value={profile.address_zip}
              onChange={(e) =>
                update("address_zip", e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              placeholder="78701"
              maxLength={5}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={profile.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="(512) 555-0100"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="john@example.com"
          />
        </div>

        <div>
          <Label htmlFor="dl">Driver&apos;s License Number</Label>
          <Input
            id="dl"
            value={profile.drivers_license}
            onChange={(e) => update("drivers_license", e.target.value)}
            placeholder="DL12345678"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-navy hover:bg-navy-light text-white"
        >
          {saving ? "Saving..." : "Save Profile"}
        </Button>
        {saved && (
          <span className="text-sm text-green-complete font-medium">
            Saved!
          </span>
        )}
      </div>
    </div>
  );
}
