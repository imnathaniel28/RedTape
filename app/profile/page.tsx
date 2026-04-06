import { ProfileForm } from "@/components/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Your Profile</h1>
        <p className="text-muted-foreground mt-1">
          Fill in your information below. This is used to pre-fill government forms automatically.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
