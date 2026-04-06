import type { Metadata } from "next";
import { Geist, Geist_Mono, Permanent_Marker } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { TapeHeader } from "@/components/TapeHeader";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const permanentMarker = Permanent_Marker({
  weight: "400",
  variable: "--font-marker",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RedTape",
  description:
    "An AI agent that navigates government paperwork so you don't have to.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignUpUrl="/profile" afterSignInUrl="/dashboard">
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${permanentMarker.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          {/* Base background */}
          <div
            className="fixed inset-0 -z-10"
            style={{
              backgroundImage: "url('/background.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <AnimatedBackground />
          <TapeHeader />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
          <footer className="py-6 text-center text-xs text-muted-foreground">
            RedTape — Never auto-submits government forms. Always
            review before filing.
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
