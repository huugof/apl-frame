import { NextResponse } from "next/server";
import { Pattern } from "@/app/types";
import { patterns } from "@/app/data/patterns";

// Tell Next.js this is a dynamic route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Get the daily pattern based on the current UTC date
 * The pattern changes at midnight UTC each day
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export async function GET() {
  try {
    const now = new Date();
    const minutes = Math.floor(now.getTime() / (1000 * 60));
    const index = minutes % patterns.length;
    const pattern = patterns[index];

    return NextResponse.json(
      { pattern },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Failed to get pattern:", error);
    return NextResponse.json(
      { error: "Failed to get pattern" },
      { status: 500 }
    );
  }
} 