import { NextResponse } from "next/server";
import { PatternService } from "@/app/services/pattern.service";
import { sendFrameNotification } from "@/lib/notifs";
import { getAllUsersWithNotifications } from "@/lib/kv";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

/**
 * Cron job endpoint that checks for new patterns and sends notifications
 */
export async function GET() {
  console.log("[CRON] Starting daily pattern notification check");
  try {
    // Get the latest pattern
    const latestPattern = await PatternService.getDailyPattern();
    console.log("[CRON] Latest pattern:", {
      id: latestPattern.id,
      title: latestPattern.title
    });

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
          body: `Check out today's pattern: ${latestPattern.title}`,
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