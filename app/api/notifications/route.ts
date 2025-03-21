import { NextResponse } from "next/server";
import { PatternService } from "@/app/services/pattern.service";
import { sendFrameNotification } from "@/lib/notifs";
import { getAllUsersWithNotifications, getRedisClient } from "@/lib/kv";
import { patterns } from "@/app/data/patterns";
import { Pattern } from "@/app/types";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

/**
 * Get the current run number for today and increment it
 * @returns The current run number (0-based)
 */
async function getAndIncrementRunNumber(): Promise<number> {
  const redis = await getRedisClient();
  const today = new Date();
  const dateKey = `run_count:${today.toISOString().split("T")[0]}`;
  
  // Get current run number and increment it atomically
  const runNumber = await redis.incr(dateKey);
  // Set expiry to 24 hours from now to ensure the counter resets daily
  await redis.expire(dateKey, 24 * 60 * 60);
  
  return runNumber - 1; // Convert to 0-based index
}

/**
 * Cron job endpoint that generates a new pattern and sends notifications
 */
export async function GET() {
  console.log("[CRON] Starting daily pattern generation");
  
  try {
    // Get the current run number for today
    const runNumber = await getAndIncrementRunNumber();
    console.log("[CRON] Current run number:", runNumber);
    
    // Get today's pattern using the run number
    const pattern = await PatternService.getDailyPattern(runNumber);
    console.log("[CRON] Generated pattern:", {
      id: pattern.id,
      title: pattern.title,
      runNumber
    });
    
    // Get all users who have notifications enabled
    const users = await getAllUsersWithNotifications();
    console.log("[CRON] Found users to notify:", users.length);
    
    // Send notifications to all users
    const notificationPromises = users.map((user) =>
      sendFrameNotification({
        fid: user.fid,
        title: "New Pattern Available!",
        body: `Check out this pattern: ${pattern.title}`,
        notificationDetails: user.details
      })
    );
    
    await Promise.all(notificationPromises);
    console.log("[CRON] Successfully sent notifications");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CRON] Error in pattern generation:", error);
    return NextResponse.json(
      { error: "Failed to generate pattern" },
      { status: 500 }
    );
  }
} 