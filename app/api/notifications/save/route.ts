import { NextResponse } from "next/server";
import { setUserNotificationDetails } from "@/lib/kv";
import { FrameNotificationDetails } from "@farcaster/frame-sdk";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

/**
 * Save notification details for a user
 */
export async function POST(request: Request) {
  console.log("[API] POST /api/notifications/save - Starting request");
  try {
    const body = await request.json();
    console.log("[API] Received notification details:", {
      ...body,
      token: body.token ? "[REDACTED]" : undefined
    });

    // Get the user's FID from the request headers
    const fid = request.headers.get("x-farcaster-fid");
    if (!fid) {
      console.error("[API] No FID found in request headers");
      return NextResponse.json(
        { error: "No FID provided" },
        { status: 400 }
      );
    }

    const notificationDetails: FrameNotificationDetails = {
      url: body.url,
      token: body.token,
    };

    console.log(`[API] Saving notification details for user ${fid}`);
    await setUserNotificationDetails(parseInt(fid, 10), notificationDetails);
    console.log("[API] Successfully saved notification details");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to save notification details:", error);
    if (error instanceof Error) {
      console.error("[API] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: "Failed to save notification details" },
      { status: 500 }
    );
  }
} 