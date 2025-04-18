import { notificationDetailsSchema } from "@farcaster/frame-sdk";
import { NextRequest } from "next/server";
import { z } from "zod";
import { setUserNotificationDetails } from "@/lib/kv";
import { sendFrameNotification } from "@/lib/notifs";

const requestSchema = z.object({
  fid: z.number(),
  notificationDetails: notificationDetailsSchema,
});

export async function POST(request: NextRequest) {
  try {
    console.log("[API] POST /api/send-notification - Starting request");
    const requestJson = await request.json();
    console.log("[API] Request body:", {
      ...requestJson,
      notificationDetails: {
        ...requestJson.notificationDetails,
        token: "[REDACTED]"
      }
    });
    
    const requestBody = requestSchema.safeParse(requestJson);

    if (requestBody.success === false) {
      console.error("[API] Invalid request body:", requestBody.error.errors);
      return Response.json(
        { success: false, errors: requestBody.error.errors },
        { status: 400 }
      );
    }

    const { fid, notificationDetails } = requestBody.data;
    console.log(`[API] Sending test notification to user ${fid}`);

    // Validate token format
    const tokenRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!tokenRegex.test(notificationDetails.token)) {
      console.error("[API] Invalid token format:", notificationDetails.token);
      return Response.json(
        { success: false, error: "Invalid token format" },
        { status: 400 }
      );
    }

    // Send test notification using the notification details from the request
    const sendResult = await sendFrameNotification({
      fid,
      title: "Test notification",
      body: "Sent at " + new Date().toISOString(),
      notificationDetails, // Pass the notification details directly
    });

    if (sendResult.state === "error") {
      console.error("[API] Failed to send notification:", sendResult.error);
      return Response.json(
        { success: false, error: sendResult.error },
        { status: 500 }
      );
    } else if (sendResult.state === "rate_limit") {
      console.log("[API] Rate limited when sending notification");
      return Response.json(
        { success: false, error: "Rate limited" },
        { status: 429 }
      );
    }

    console.log("[API] Successfully sent test notification");
    return Response.json({ success: true });
  } catch (error) {
    console.error("[API] Error in send-notification endpoint:", error);
    if (error instanceof Error) {
      console.error("[API] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}