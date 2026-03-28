import { ProfileForm } from "@/components/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Your Profile</h1>
        <p className="text-muted-foreground mt-1">
          This information is used to pre-fill government forms. It&apos;s stored
          locally and never sent to any server.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
