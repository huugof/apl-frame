import { NextRequest, NextResponse } from "next/server";
import { notificationManager, CreateNotificationParams } from "../../../lib/notifs";
import { z } from "zod";

/**
 * Request body schema validation
 */
const NotificationRequestSchema = z.object({
  userId: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(["success", "error", "info", "warning"]),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * POST /api/send-notification
 * Sends a notification to a specific user
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = NotificationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error },
        { status: 400 }
      );
    }

    const notificationParams: CreateNotificationParams = validationResult.data;
    
    // Create the notification
    const notification = await notificationManager.createNotification(notificationParams);

    return NextResponse.json(
      { message: "Notification sent successfully", notification },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
} 