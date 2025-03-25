import { NextRequest, NextResponse } from "next/server";
import { PatternService } from "@/app/services/pattern.service";
import { getRedisClient } from "@/lib/kv";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

/**
 * Get pattern details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("[API] GET /api/pattern/[id] - Starting request");
  try {
    const patternId = parseInt(params.id, 10);
    if (isNaN(patternId)) {
      console.error("[API] Invalid pattern ID:", params.id);
      return NextResponse.json(
        { error: "Invalid pattern ID" },
        { status: 400 }
      );
    }

    // Initialize Redis client
    const redis = getRedisClient();
    PatternService.initialize(redis);

    // Get pattern by ID
    const pattern = await PatternService.getPatternById(patternId);
    if (!pattern) {
      console.error("[API] Pattern not found:", patternId);
      return NextResponse.json(
        { error: "Pattern not found" },
        { status: 404 }
      );
    }

    console.log("[API] Successfully retrieved pattern:", {
      id: pattern.id,
      title: pattern.title
    });

    return NextResponse.json(pattern);
  } catch (error) {
    console.error("[API] Failed to get pattern:", error);
    if (error instanceof Error) {
      console.error("[API] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: "Failed to get pattern" },
      { status: 500 }
    );
  }
} 