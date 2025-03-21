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
    // Get today's pattern
    const latestPattern = await PatternService.getDailyPattern();
    console.log("[CHECK] Latest pattern:", {
      id: latestPattern.id,
      title: latestPattern.title
    });

    // Get yesterday's pattern
    const previousPattern = await PatternService.getPreviousPattern();
    console.log("[CHECK] Previous pattern:", {
      id: previousPattern.id,
      title: previousPattern.title
    });

    // If the pattern has changed
    if (previousPattern.id !== latestPattern.id) {
      console.log("[CHECK] Pattern change detected! Sending notifications...");
      
      // Get all users with notifications enabled
      const users = await getAllUsersWithNotifications();
      console.log(`[CHECK] Found ${users.length} users with notifications enabled`);

      // Send notifications to all users
      for (const user of users) {
        try {
          console.log(`[CHECK] Sending notification to user ${user.fid}`);
          const sendResult = await sendFrameNotification({
            fid: user.fid,
            title: `${latestPattern.title}`,
            body: `Check out Pattern! ${latestPattern.id}`,
            notificationDetails: user.details,
          });

          if (sendResult.state === "error") {
            console.error(`[CHECK] Failed to send notification to user ${user.fid}:`, sendResult.error);
          } else if (sendResult.state === "rate_limit") {
            console.log(`[CHECK] Rate limited when sending to user ${user.fid}`);
          } else {
            console.log(`[CHECK] Successfully sent notification to user ${user.fid}`);
          }
        } catch (error) {
          console.error(`[CHECK] Error sending notification to user ${user.fid}:`, error);
        }
      }

      // Update the last pattern ID in Redis (store as string)
      const redis = getRedisClient();
      await redis.set("apl-daily:last-pattern-id", latestPattern.id.toString());
      console.log("[CHECK] Updated last pattern ID in Redis");
    } else {
      console.log("[CHECK] No pattern change detected");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHECK] Error in pattern change check:", error);
    if (error instanceof Error) {
      console.error("[CHECK] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: "Failed to check for pattern changes" },
      { status: 500 }
    );
  }
} 