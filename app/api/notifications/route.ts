import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/app/services/notification.service";
import { PatternService } from "@/app/services/pattern.service";

/**
 * Handle POST requests to send notifications
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get today's pattern
    const pattern = await PatternService.getDailyPattern();
    
    // Send notification
    await NotificationService.sendNotification({
      channelId: process.env.FARCASTER_CHANNEL_ID || "",
      url: `${process.env.NEXT_PUBLIC_HOST}/pattern/${pattern.id}`,
      text: `Today's Pattern: ${pattern.name}\n\n${pattern.problem}`,
      buttonText: "View Pattern",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
} 