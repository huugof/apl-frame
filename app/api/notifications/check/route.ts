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
    // Get the latest pattern
    const latestPattern = await PatternService.getDailyPattern();
    console.log("[CHECK] Latest pattern:", {
      id: latestPattern.id,
      title: latestPattern.title
    });

    // Get the last pattern ID from Redis and convert it to a number
    const redis = getRedisClient();
    const lastPatternIdStr = await redis.get<string>("apl-daily:last-pattern-id");
    const lastPatternId = lastPatternIdStr ? parseInt(lastPatternIdStr, 10) : null;
    console.log("[CHECK] Last pattern ID:", lastPatternId);

    // If this is the first pattern or the pattern has changed
    if (!lastPatternId || lastPatternId !== latestPattern.id) {
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
    } else {
      console.log("[CHECK] No pattern change detected");
    }

    // Always update the last pattern ID in Redis (store as string)
    await redis.set("apl-daily:last-pattern-id", latestPattern.id.toString());
    console.log("[CHECK] Updated last pattern ID in Redis");

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