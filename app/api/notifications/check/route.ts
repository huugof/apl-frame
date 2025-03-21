import { NextResponse } from "next/server";
import { PatternService } from "@/app/services/pattern.service";
import { sendFrameNotification } from "@/lib/notifs";
import { getAllUsersWithNotifications, getRedisClient } from "@/lib/kv";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

/**
 * Endpoint that checks for pattern changes and sends notifications if a new pattern is detected
 */
export async function GET() {
  console.log("[CHECK] Starting pattern change check");
  try {
    // Get the pattern ID from Redis
    const redis = getRedisClient();
    const patternIdStr = await redis.get<string>("apl-daily:last-pattern-id");
    
    if (!patternIdStr) {
      console.error("[CHECK] No pattern ID found in Redis");
      return NextResponse.json(
        { error: "No pattern available" },
        { status: 500 }
      );
    }

    const patternId = parseInt(patternIdStr, 10);
    const pattern = await PatternService.getPatternById(patternId);
    
    if (!pattern) {
      console.error("[CHECK] Pattern not found for ID:", patternId);
      return NextResponse.json(
        { error: "Pattern not found" },
        { status: 500 }
      );
    }

    console.log("[CHECK] Current pattern:", {
      id: pattern.id,
      title: pattern.title
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHECK] Error in pattern check:", error);
    if (error instanceof Error) {
      console.error("[CHECK] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: "Failed to check pattern" },
      { status: 500 }
    );
  }
} 