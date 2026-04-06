'use client'

import Image from 'next/image'
import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

/**
 * RedTapeLogoOfficial.png — 1534×575, ratio 2.67:1, transparent bg
 * Content fills ~96% of the image (only 2% transparent padding on each side).
 * No complex cropping needed — just display at natural ratio, capped at max-width.
 */

export function TapeHeader() {
  return (
    <>
      {/* ── Brand banner (not sticky — scrolls away) ─────────────────────── */}
      <div className="relative w-full flex justify-center pt-2">
        <Link
          href="/"
          style={{
            maxWidth: '860px',
            width: '100%',
            aspectRatio: '1534 / 575',
            position: 'relative',
            display: 'block',
          }}
        >
          <Image
            src="/RedTapeLogoOfficial.png"
            alt="RedTape"
            fill
            priority
            sizes="(max-width: 860px) 100vw, 860px"
            style={{ objectFit: 'contain' }}
          />
        </Link>
        <div className="absolute top-4 right-4 z-10">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm text-navy font-medium hover:underline">Sign In</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>

    </>
  )
}
