import {
  SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/frame-sdk";
import { getUserNotificationDetails } from "@/lib/kv";

const appUrl = process.env.NEXT_PUBLIC_URL || "";

type SendFrameNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | { state: "rate_limit" }
  | { state: "success" };

export async function sendFrameNotification({
  fid,
  title,
  body,
}: {
  fid: number;
  title: string;
  body: string;
}): Promise<SendFrameNotificationResult> {
  console.log(`[NOTIF] Attempting to send notification to user ${fid}`);
  console.log(`[NOTIF] Title: ${title}`);
  console.log(`[NOTIF] Body: ${body}`);
  
  const notificationDetails = await getUserNotificationDetails(fid);
  if (!notificationDetails) {
    console.log(`[NOTIF] No notification details found for user ${fid}`);
    return { state: "no_token" };
  }

  console.log(`[NOTIF] Found notification details for user ${fid}`);
  console.log(`[NOTIF] Notification URL: ${notificationDetails.url}`);
  console.log(`[NOTIF] Token present: ${!!notificationDetails.token}`);

  const notificationRequest = {
    notificationId: crypto.randomUUID(),
    title,
    body,
    targetUrl: appUrl,
    tokens: [notificationDetails.token],
  } satisfies SendNotificationRequest;

  console.log("[NOTIF] Sending notification request:", {
    ...notificationRequest,
    tokens: ["[REDACTED]"]
  });

  try {
    const response = await fetch(notificationDetails.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notificationRequest),
    });

    console.log(`[NOTIF] Response status: ${response.status}`);
    const responseJson = await response.json();
    console.log("[NOTIF] Response body:", responseJson);

    if (response.status === 200) {
      const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
      if (responseBody.success === false) {
        console.error("[NOTIF] Malformed response:", responseBody.error.errors);
        return { state: "error", error: responseBody.error.errors };
      }

      if (responseBody.data.result.rateLimitedTokens.length) {
        console.log("[NOTIF] Rate limited tokens:", responseBody.data.result.rateLimitedTokens);
        return { state: "rate_limit" };
      }

      console.log("[NOTIF] Successfully sent notification");
      return { state: "success" };
    } else {
      console.error("[NOTIF] Error response:", responseJson);
      return { state: "error", error: responseJson };
    }
  } catch (error) {
    console.error("[NOTIF] Error sending notification:", error);
    if (error instanceof Error) {
      console.error("[NOTIF] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return { state: "error", error };
  }
}