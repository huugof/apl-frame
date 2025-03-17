/**
 * Webhook route handler for Farcaster Frame events
 * Handles frame_added, frame_removed, notifications_enabled, and notifications_disabled events
 */

import {
  ParseWebhookEvent,
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/frame-node";
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { notificationManager } from "../../../lib/notifs";
import { z } from "zod";

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
});

/**
 * Type definitions for notification handling
 */
interface NotificationDetails {
  notificationsEnabled: boolean;
  notificationToken: string;
  notificationEndpoint: string;
}

interface NotificationPayload {
  fid: number;
  title: string;
  body: string;
}

/**
 * Webhook request body schema validation for general notifications
 */
const WebhookRequestSchema = z.object({
  userId: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(["success", "error", "info", "warning"]).default("info"),
  metadata: z.record(z.unknown()).optional(),
  signature: z.string().optional(),
});

/**
 * Stores user notification details in Redis
 */
async function setUserNotificationDetails(
  fid: number,
  details: NotificationDetails
): Promise<void> {
  console.log("[setUserNotificationDetails] Storing details for FID:", fid, "Details:", details);
  await redis.set(`notifications:${fid}`, JSON.stringify(details));
  console.log("[setUserNotificationDetails] Successfully stored notification details");
}

/**
 * Deletes user notification details from Redis
 */
async function deleteUserNotificationDetails(fid: number): Promise<void> {
  console.log("[deleteUserNotificationDetails] Removing details for FID:", fid);
  await redis.del(`notifications:${fid}`);
  console.log("[deleteUserNotificationDetails] Successfully removed notification details");
}

/**
 * Sends a notification to a user
 */
async function sendFrameNotification({
  fid,
  title,
  body,
}: NotificationPayload): Promise<void> {
  console.log("[sendFrameNotification] Attempting to send notification to FID:", fid);
  const details = await redis.get<string>(`notifications:${fid}`);
  if (!details) {
    console.log("[sendFrameNotification] No notification details found for FID:", fid);
    return;
  }

  const notificationDetails: NotificationDetails = JSON.parse(details);
  console.log("[sendFrameNotification] Retrieved notification details:", notificationDetails);
  
  if (!notificationDetails.notificationsEnabled) {
    console.log("[sendFrameNotification] Notifications are disabled for FID:", fid);
    return;
  }

  try {
    console.log("[sendFrameNotification] Sending notification to endpoint:", notificationDetails.notificationEndpoint);
    const response = await fetch(notificationDetails.notificationEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${notificationDetails.notificationToken}`,
      },
      body: JSON.stringify({ title, body }),
    });
    
    const responseData = await response.text();
    console.log("[sendFrameNotification] Response status:", response.status);
    console.log("[sendFrameNotification] Response body:", responseData);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("[sendFrameNotification] Failed to send notification:", error);
  }
}

/**
 * Verifies the webhook signature for general webhooks
 */
function verifyWebhookSignature(signature: string | undefined, body: unknown): boolean {
  // TODO: Implement webhook signature verification based on your requirements
  return true;
}

/**
 * POST handler for webhook events
 * Handles both Farcaster Frame webhooks and general notification webhooks
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log("[Webhook] Received webhook request");
  const requestJson = await request.json();
  console.log("[Webhook] Request body:", JSON.stringify(requestJson, null, 2));

  // Try to handle as a Farcaster Frame webhook first
  try {
    const data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
    console.log("[Webhook] Successfully parsed Farcaster event data:", data);

    const fid = data.fid;
    const event = data.event;
    console.log("[Webhook] Processing Farcaster event type:", event.event, "for FID:", fid);

    switch (event.event) {
      case "frame_added":
        if (event.notificationDetails) {
          console.log("[Webhook] Frame added with notification details:", event.notificationDetails);
          const mappedNotificationDetails: NotificationDetails = {
            notificationsEnabled: true,
            notificationToken: event.notificationDetails.token,
            notificationEndpoint: event.notificationDetails.url
          };
          await setUserNotificationDetails(fid, mappedNotificationDetails);
          await sendFrameNotification({
            fid,
            title: "Frame Added",
            body: "Your frame has been successfully added!",
          });
        } else {
          console.log("[Webhook] Frame added without notification details");
          await deleteUserNotificationDetails(fid);
        }
        break;

      case "frame_removed":
        console.log("[Webhook] Frame removed for FID:", fid);
        await deleteUserNotificationDetails(fid);
        break;

      case "notifications_enabled":
        if (event.notificationDetails) {
          console.log("[Webhook] Notifications enabled with details:", event.notificationDetails);
          const mappedNotificationDetails: NotificationDetails = {
            notificationsEnabled: true,
            notificationToken: event.notificationDetails.token,
            notificationEndpoint: event.notificationDetails.url
          };
          await setUserNotificationDetails(fid, mappedNotificationDetails);
          await sendFrameNotification({
            fid,
            title: "Notifications Enabled",
            body: "You will now receive notifications for this frame",
          });
        }
        break;

      case "notifications_disabled":
        console.log("[Webhook] Notifications disabled for FID:", fid);
        await deleteUserNotificationDetails(fid);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    // If it's not a valid Farcaster Frame webhook, try handling it as a general webhook
    try {
      console.log("[Webhook] Not a Farcaster webhook, trying as general webhook");
      // Validate request body as general webhook
      const validationResult = WebhookRequestSchema.safeParse(requestJson);
      if (!validationResult.success) {
        console.error("[Webhook] Invalid general webhook payload:", validationResult.error);
        return NextResponse.json(
          { error: "Invalid webhook payload", details: validationResult.error },
          { status: 400 }
        );
      }

      const { signature, ...notificationData } = validationResult.data;

      // Verify webhook signature if provided
      if (signature && !verifyWebhookSignature(signature, requestJson)) {
        console.error("[Webhook] Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }

      // Create the notification
      console.log("[Webhook] Creating general notification:", notificationData);
      const notification = await notificationManager.createNotification(notificationData);

      return NextResponse.json(
        { message: "Webhook processed successfully", notification },
        { status: 200 }
      );
    } catch (error) {
      // If both Farcaster and general webhook handling fail, check if it was a Farcaster error first
      const farcasterError = e as ParseWebhookEvent.ErrorType;
      if (farcasterError.name) {
        console.error("[Webhook] Farcaster webhook error:", farcasterError);
        switch (farcasterError.name) {
          case "VerifyJsonFarcasterSignature.InvalidDataError":
          case "VerifyJsonFarcasterSignature.InvalidEventDataError":
            return NextResponse.json(
              { success: false, error: farcasterError.message },
              { status: 400 }
            );
          case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
            return NextResponse.json(
              { success: false, error: farcasterError.message },
              { status: 401 }
            );
          case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
            return NextResponse.json(
              { success: false, error: farcasterError.message },
              { status: 500 }
            );
        }
      }

      // General error handling
      console.error("[Webhook] Failed to process webhook:", error);
      return NextResponse.json(
        { error: "Failed to process webhook" },
        { status: 500 }
      );
    }
  }
} 