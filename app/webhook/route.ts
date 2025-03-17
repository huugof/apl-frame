/**
 * Webhook route handler for Farcaster Frame events
 * Handles frame_added, frame_removed, notifications_enabled, and notifications_disabled events
 */

import {
  ParseWebhookEvent,
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/frame-node";
import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
});

/**
 * Type definition for notification details
 */
type NotificationDetails = {
  notificationsEnabled: boolean;
  notificationToken: string;
  notificationEndpoint: string;
};

/**
 * Type definition for notification payload
 */
type NotificationPayload = {
  fid: number;
  title: string;
  body: string;
};

/**
 * Stores user notification details in Redis
 */
async function setUserNotificationDetails(
  fid: number,
  details: NotificationDetails
): Promise<void> {
  await redis.set(`notifications:${fid}`, JSON.stringify(details));
}

/**
 * Deletes user notification details from Redis
 */
async function deleteUserNotificationDetails(fid: number): Promise<void> {
  await redis.del(`notifications:${fid}`);
}

/**
 * Sends a notification to a user
 */
async function sendFrameNotification({
  fid,
  title,
  body,
}: NotificationPayload): Promise<void> {
  const details = await redis.get<string>(`notifications:${fid}`);
  if (!details) return;

  const notificationDetails: NotificationDetails = JSON.parse(details);
  if (!notificationDetails.notificationsEnabled) return;

  try {
    await fetch(notificationDetails.notificationEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${notificationDetails.notificationToken}`,
      },
      body: JSON.stringify({
        title,
        body,
      }),
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

/**
 * POST handler for webhook events
 */
export async function POST(request: NextRequest): Promise<Response> {
  const requestJson = await request.json();

  let data;
  try {
    data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
  } catch (e: unknown) {
    const error = e as ParseWebhookEvent.ErrorType;

    switch (error.name) {
      case "VerifyJsonFarcasterSignature.InvalidDataError":
      case "VerifyJsonFarcasterSignature.InvalidEventDataError":
        return Response.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
        return Response.json(
          { success: false, error: error.message },
          { status: 401 }
        );
      case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
        return Response.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      default:
        return Response.json(
          { success: false, error: "Unknown error" },
          { status: 500 }
        );
    }
  }

  const fid = data.fid;
  const event = data.event;

  switch (event.event) {
    case "frame_added":
      if (event.notificationDetails) {
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
        await deleteUserNotificationDetails(fid);
      }
      break;

    case "frame_removed":
      await deleteUserNotificationDetails(fid);
      break;

    case "notifications_enabled":
      if (event.notificationDetails) {
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
      await deleteUserNotificationDetails(fid);
      break;
  }

  return Response.json({ success: true });
} 