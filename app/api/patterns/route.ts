import { NextResponse } from "next/server";
import { Pattern } from "@/app/types";
import { patterns } from "@/app/data/patterns";
import { getRedisClient } from "@/lib/kv";

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
    // Get the pattern ID from Redis
    const redis = getRedisClient();
    const patternIdStr = await redis.get<string>("apl-daily:last-pattern-id");
    
    if (!patternIdStr) {
      console.error("[PATTERNS] No pattern ID found in Redis");
      return NextResponse.json(
        { error: "No pattern available" },
        { status: 500 }
      );
    }

    const patternId = parseInt(patternIdStr, 10);
    const pattern = patterns.find(p => p.id === patternId);

    if (!pattern) {
      console.error("[PATTERNS] Pattern not found for ID:", patternId);
      return NextResponse.json(
        { error: "Pattern not found" },
        { status: 500 }
      );
    }

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