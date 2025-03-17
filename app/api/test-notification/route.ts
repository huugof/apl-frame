import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/app/services/notification.service";
import { PatternService } from "@/app/services/pattern.service";

/**
 * Handle GET requests to test notifications
 * This endpoint is only available in development
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "This endpoint is only available in development" }, { status: 403 });
  }

  try {
    // Get today's pattern
    const pattern = await PatternService.getDailyPattern();
    
    // Send test notification
    await NotificationService.sendNotification({
      channelId: process.env.FARCASTER_CHANNEL_ID || "",
      url: `${process.env.NEXT_PUBLIC_HOST}/pattern/${pattern.id}`,
      text: `[TEST] Today's Pattern: ${pattern.name}\n\n${pattern.problem}`,
      buttonText: "View Pattern",
    });

    return NextResponse.json({ success: true, message: "Test notification sent" });
  } catch (error) {
    console.error("Error sending test notification:", error);
    return NextResponse.json({ error: "Failed to send test notification" }, { status: 500 });
  }
} 