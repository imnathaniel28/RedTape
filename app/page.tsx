import { EventWizard } from "@/components/EventWizard";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4">
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-navy tracking-tight">
          What&apos;s happening in your life?
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          Describe a life event and we&apos;ll find every government form you
          need — organized, tracked, and ready to fill.
        </p>
      </div>
      <EventWizard />
    </div>
  );
}
