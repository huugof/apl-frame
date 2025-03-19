import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis";

// Debug log Redis configuration
console.log("Redis URL configured:", !!process.env.KV_REST_API_URL);
console.log("Redis Token configured:", !!process.env.KV_REST_API_TOKEN);

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function getUserNotificationDetailsKey(fid: number): string {
  return `apl-daily:user:${fid}`;
}

export async function getUserNotificationDetails(
  fid: number
): Promise<FrameNotificationDetails | null> {
  try {
    const key = getUserNotificationDetailsKey(fid);
    console.log("Getting notification details for key:", key);
    const result = await redis.get<FrameNotificationDetails>(key);
    console.log("Retrieved notification details:", result);
    return result;
  } catch (error) {
    console.error("Error getting notification details:", error);
    return null;
  }
}

export async function getAllUsersWithNotifications(): Promise<Array<{ fid: number; details: FrameNotificationDetails }>> {
  try {
    // Get all keys matching the pattern
    const keys = await redis.keys("apl-daily:user:*");
    const users: Array<{ fid: number; details: FrameNotificationDetails }> = [];

    // Get notification details for each user
    for (const key of keys) {
      const fid = parseInt(key.split(":")[2], 10);
      const details = await redis.get<FrameNotificationDetails>(key);
      if (details) {
        users.push({ fid, details });
      }
    }

    return users;
  } catch (error) {
    console.error("Error getting all users with notifications:", error);
    return [];
  }
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  try {
    const key = getUserNotificationDetailsKey(fid);
    console.log("Setting notification details for key:", key);
    console.log("Notification details to save:", notificationDetails);
    await redis.set(key, notificationDetails);
    console.log("Successfully saved notification details");
  } catch (error) {
    console.error("Error saving notification details:", error);
    throw error;
  }
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  try {
    const key = getUserNotificationDetailsKey(fid);
    console.log("Deleting notification details for key:", key);
    await redis.del(key);
    console.log("Successfully deleted notification details");
  } catch (error) {
    console.error("Error deleting notification details:", error);
    throw error;
  }
}