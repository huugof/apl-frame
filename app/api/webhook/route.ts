import {
  ParseWebhookEvent,
  parseWebhookEvent,
  // uncomment this line to use Neynar verification function
  // verifyAppKeyWithNeynar,
  VerifyAppKeyResult,
} from "@farcaster/frame-node";
import { NextRequest } from "next/server";
import {
  deleteUserNotificationDetails,
  setUserNotificationDetails,
} from "@/lib/kv";
import { sendFrameNotification } from "@/lib/notifs";

// Comment out this function if you want to use Neynar verification function
// Custom verification function that always approves the webhook
// This is less secure but doesn't require Neynar
async function verifyAppKey(fid: number, key: string): Promise<VerifyAppKeyResult> {
  // In a production environment, you should implement proper verification
  // For now, we'll just return a successful verification
  return {
    valid: true,
    appFid: fid
  };
}

export async function POST(request: NextRequest) {
  const requestJson = await request.json();
  
  // Log the incoming webhook payload for debugging
  console.log("Incoming webhook payload:", JSON.stringify(requestJson, null, 2));

  let data;
  try {
    console.log("Attempting to parse webhook event...");
    // uncomment this line to use Neynar verification function
    // data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
    data = await parseWebhookEvent(requestJson, verifyAppKey);
    console.log("Successfully parsed webhook event:", JSON.stringify(data, null, 2));
  } catch (e: unknown) {
    const error = e as ParseWebhookEvent.ErrorType;
    console.error("Error parsing webhook event:", error);

    switch (error.name) {
      case "VerifyJsonFarcasterSignature.InvalidDataError":
      case "VerifyJsonFarcasterSignature.InvalidEventDataError":
        // The request data is invalid
        return Response.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
        // The app key is invalid
        return Response.json(
          { success: false, error: error.message },
          { status: 401 }
        );
      case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
        // Internal error verifying the app key (caller may want to try again)
        return Response.json(
          { success: false, error: error.message },
          { status: 500 }
        );
    }
  }

  const fid = data.fid;
  const event = data.event;
  console.log("Processing event type:", event.event, "for fid:", fid);

  try {
    switch (event.event) {
      case "frame_added":
        console.log("Processing frame_added event");
        if (event.notificationDetails) {
          console.log("Notification details present, saving...");
          await setUserNotificationDetails(fid, event.notificationDetails);
          console.log("Sending welcome notification...");
          await sendFrameNotification({
            fid,
            title: "Welcome to Frames v2",
            body: "Frame is now added to your client",
          });
        } else {
          console.log("No notification details, deleting...");
          await deleteUserNotificationDetails(fid);
        }
        break;

      case "frame_removed":
        console.log("Processing frame_removed event");
        await deleteUserNotificationDetails(fid);
        break;

      case "notifications_enabled":
        console.log("Processing notifications_enabled event");
        await setUserNotificationDetails(fid, event.notificationDetails);
        console.log("Sending notification enabled confirmation...");
        await sendFrameNotification({
          fid,
          title: "Ding ding ding",
          body: "Notifications are now enabled",
        });
        break;

      case "notifications_disabled":
        console.log("Processing notifications_disabled event");
        await deleteUserNotificationDetails(fid);
        break;
    }

    console.log("Successfully processed webhook event");
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook event:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}