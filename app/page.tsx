import Image from "next/image";
import { EventWizard } from "@/components/EventWizard";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4">
      <div className="text-center space-y-2 mb-10">
        {/* Hand-drawn banner image */}
        <div className="w-full max-w-5xl mx-auto">
          <Image
            src="/Whats_banner.png"
            alt="What's happening in your life?!!"
            width={875}
            height={120}
            priority
            className="w-full h-auto"
          />
        </div>

        <p className="text-lg text-gray-600 max-w-lg mx-auto pt-2">
          Tell us about a life event and we&apos;ll find every government form
          you need to get through the bureaucracy.{" "}
          <span className="text-red-600 font-bold text-xl align-top">!!!</span>
        </p>
      </div>
      <EventWizard />
    </div>
  );
}
