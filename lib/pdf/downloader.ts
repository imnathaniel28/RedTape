import fs from "fs";
import path from "path";
import crypto from "crypto";

const CACHE_DIR = path.join(process.cwd(), "data", "pdf-cache");

function getCachePath(url: string): string {
  const hash = crypto.createHash("sha256").update(url).digest("hex");
  return path.join(CACHE_DIR, `${hash}.pdf`);
}

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export async function downloadPdf(url: string): Promise<Uint8Array> {
  ensureCacheDir();
  const cachePath = getCachePath(url);

  if (fs.existsSync(cachePath)) {
    return new Uint8Array(fs.readFileSync(cachePath));
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/pdf,*/*",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Verify it's actually a PDF
  const header = new TextDecoder("latin1").decode(bytes.slice(0, 5));
  if (!header.startsWith("%PDF")) {
    throw new Error("Downloaded file is not a valid PDF");
  }

  fs.writeFileSync(cachePath, bytes);
  return bytes;
}

export function getCachedPdf(url: string): Uint8Array | null {
  const cachePath = getCachePath(url);
  if (fs.existsSync(cachePath)) {
    return new Uint8Array(fs.readFileSync(cachePath));
  }
  return null;
}

export function cachePdfBytes(url: string, bytes: Uint8Array): void {
  ensureCacheDir();
  const cachePath = getCachePath(url);
  fs.writeFileSync(cachePath, bytes);
}
