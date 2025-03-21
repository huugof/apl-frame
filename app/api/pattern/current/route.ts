import { NextResponse } from "next/server";
import { PatternService } from "@/app/services/pattern.service";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

/**
 * Get the current pattern
 */
export async function GET() {
  try {
    const pattern = await PatternService.getCurrentPattern();
    return NextResponse.json({ pattern });
  } catch (error) {
    console.error("[API] Error getting current pattern:", error);
    return NextResponse.json(
      { error: "Failed to get current pattern" },
      { status: 500 }
    );
  }
} 