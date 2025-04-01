import { NextResponse } from "next/server";
import { PatternService } from "@/app/services/pattern.service";
import { sendFrameNotification } from "@/lib/notifs";
import { getAllUsersWithNotifications, getRedisClient } from "@/lib/kv";
import { getCurrentPatternId, getNextPatternId } from "@/app/data/pattern-list";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

/**
 * Send notifications to all users about the next pattern
 */
export async function GET() {
  console.log("[CRON] Starting pattern generation");

  try {
    // Initialize Redis client
    const redis = getRedisClient();
    PatternService.initialize(redis);

    // Get the next pattern
    const nextPattern = await PatternService.getNextPattern();
    if (!nextPattern) {
      console.error("[CRON] Failed to get next pattern");
      return NextResponse.json(
        { error: "Failed to get next pattern" },
        { status: 500 }
      );
    }

    // Get all users with notifications enabled
    const users = await getAllUsersWithNotifications();
    console.log(`[CRON] Found ${users.length} users with notifications enabled`);

    // Send notifications to all users
    for (const user of users) {
      try {
        console.log(`[CRON] Sending notification to user ${user.fid}`);
        const sendResult = await sendFrameNotification({
          fid: user.fid,
          title: `${nextPattern.title}`,
          body: `Check out Pattern #${nextPattern.id}!!`,
          notificationDetails: user.details,
          patternId: nextPattern.id,
        });

        if (sendResult.state === "error") {
          console.error(`[CRON] Failed to send notification to user ${user.fid}:`, sendResult.error);
        } else if (sendResult.state === "rate_limit") {
          console.log(`[CRON] Rate limited when sending to user ${user.fid}`);
        } else {
          console.log(`[CRON] Successfully sent notification to user ${user.fid}`);
        }
      } catch (error) {
        console.error(`[CRON] Error sending notification to user ${user.fid}:`, error);
      }
    }

    console.log("[CRON] Completed pattern generation");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CRON] Error in pattern generation:", error);
    if (error instanceof Error) {
      console.error("[CRON] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: "Failed to generate pattern" },
      { status: 500 }
    );
  }
} 