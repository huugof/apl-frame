import { NextResponse } from "next/server";
import { PatternService } from "@/app/services/pattern.service";
import { sendFrameNotification } from "@/lib/notifs";
import { getAllUsersWithNotifications, getRedisClient } from "@/lib/kv";
import { patterns } from "@/app/data/patterns";
import { Pattern } from "@/app/types";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

/**
 * Get a deterministic pattern for a given UTC date
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getPatternForDate(date: Date): Pattern {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceEpoch = Math.floor(utcDate.getTime() / (1000 * 60 * 60 * 24));
  const index = Math.floor(seededRandom(daysSinceEpoch) * patterns.length);
  return patterns[index];
}

/**
 * Cron job endpoint that checks for new patterns and sends notifications
 */
export async function GET() {
  console.log("[CRON] Starting daily pattern notification check");
  try {
    // Get today's pattern
    const today = new Date();
    const pattern = getPatternForDate(today);
    console.log("[CRON] Selected pattern for today:", {
      id: pattern.id,
      title: pattern.title
    });

    // Update Redis with the new pattern ID
    const redis = getRedisClient();
    await redis.set("apl-daily:last-pattern-id", pattern.id.toString());
    console.log("[CRON] Updated last pattern ID in Redis");

    // Get all users with notifications enabled
    const users = await getAllUsersWithNotifications();
    console.log(`[CRON] Found ${users.length} users with notifications enabled`);

    // Send notifications to all users
    for (const user of users) {
      try {
        console.log(`[CRON] Sending notification to user ${user.fid}`);
        const sendResult = await sendFrameNotification({
          fid: user.fid,
          title: "New Daily Pattern Available!",
          body: `Check out today's pattern: ${pattern.title}`,
          notificationDetails: user.details,
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

    console.log("[CRON] Completed daily pattern notification check");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CRON] Error in notification cron job:", error);
    if (error instanceof Error) {
      console.error("[CRON] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: "Failed to process notifications" },
      { status: 500 }
    );
  }
} 