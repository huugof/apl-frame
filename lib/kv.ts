import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis";

// Only initialize Redis on the server side
let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    if (typeof window !== "undefined") {
      throw new Error("Redis client cannot be initialized on the client side");
    }
    
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    
    if (!url || !token) {
      throw new Error("Redis configuration is missing. Please check your environment variables.");
    }
    
    redis = new Redis({
      url,
      token,
    });
  }
  return redis;
}

function getUserNotificationDetailsKey(fid: number): string {
  return `apl-daily:user:${fid}`;
}

export async function getUserNotificationDetails(
  fid: number
): Promise<FrameNotificationDetails | null> {
  try {
    const key = getUserNotificationDetailsKey(fid);
    console.log("[KV] Getting notification details for key:", key);
    const redis = getRedisClient();
    const result = await redis.get<FrameNotificationDetails>(key);
    console.log("[KV] Retrieved notification details:", {
      ...result,
      token: result?.token
    });
    return result;
  } catch (error) {
    console.error("[KV] Error getting notification details:", error);
    if (error instanceof Error) {
      console.error("[KV] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return null;
  }
}

export async function getAllUsersWithNotifications(): Promise<Array<{ fid: number; details: FrameNotificationDetails }>> {
  try {
    console.log("[KV] Getting all users with notifications");
    const redis = getRedisClient();
    
    // Get all keys matching the pattern
    const keys = await redis.keys("apl-daily:user:*");
    console.log(`[KV] Found ${keys.length} notification keys`);
    
    const users: Array<{ fid: number; details: FrameNotificationDetails }> = [];

    // Get notification details for each user
    for (const key of keys) {
      try {
        const fid = parseInt(key.split(":")[2], 10);
        console.log(`[KV] Processing key for user ${fid}`);
        const details = await redis.get<FrameNotificationDetails>(key);
        if (details) {
          users.push({ fid, details });
          console.log(`[KV] Added user ${fid} to results`);
        } else {
          console.log(`[KV] No details found for user ${fid}`);
        }
      } catch (keyError) {
        console.error(`[KV] Error processing key ${key}:`, keyError);
        // Continue with next key even if one fails
        continue;
      }
    }

    console.log(`[KV] Returning ${users.length} users with notifications`);
    return users;
  } catch (error) {
    console.error("[KV] Error getting all users with notifications:", error);
    if (error instanceof Error) {
      console.error("[KV] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return [];
  }
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  try {
    const key = getUserNotificationDetailsKey(fid);
    console.log("[KV] Setting notification details for key:", key);
    console.log("[KV] Notification details to save:", {
      ...notificationDetails,
      token: notificationDetails.token
    });
    const redis = getRedisClient();
    await redis.set(key, notificationDetails);
    console.log("[KV] Successfully saved notification details");
  } catch (error) {
    console.error("[KV] Error saving notification details:", error);
    if (error instanceof Error) {
      console.error("[KV] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    throw error;
  }
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  try {
    const key = getUserNotificationDetailsKey(fid);
    console.log("[KV] Deleting notification details for key:", key);
    const redis = getRedisClient();
    await redis.del(key);
    console.log("[KV] Successfully deleted notification details");
  } catch (error) {
    console.error("[KV] Error deleting notification details:", error);
    if (error instanceof Error) {
      console.error("[KV] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    throw error;
  }
}

function getUserBookmarksKey(fid: number): string {
  return `apl-daily:user:${fid}:bookmarks`;
}

/**
 * Get all bookmarked patterns for a user
 */
export async function getUserBookmarks(fid: number): Promise<number[]> {
  try {
    const key = getUserBookmarksKey(fid);
    console.log("[KV] Getting bookmarks for key:", key);
    const redis = getRedisClient();
    const result = await redis.smembers(key);
    const bookmarks = result.map(id => Number(id));
    console.log("[KV] Retrieved bookmarks:", bookmarks);
    return bookmarks;
  } catch (error) {
    console.error("[KV] Error getting bookmarks:", error);
    if (error instanceof Error) {
      console.error("[KV] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return [];
  }
}

/**
 * Add a pattern to user's bookmarks
 */
export async function addUserBookmark(fid: number, patternId: number): Promise<boolean> {
  try {
    const key = getUserBookmarksKey(fid);
    console.log(`[KV] Adding bookmark ${patternId} for key:`, key);
    const redis = getRedisClient();
    const result = await redis.sadd(key, patternId);
    console.log("[KV] Successfully added bookmark:", result);
    return result === 1; // Returns true if the pattern was newly added
  } catch (error) {
    console.error("[KV] Error adding bookmark:", error);
    if (error instanceof Error) {
      console.error("[KV] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return false;
  }
}

/**
 * Remove a pattern from user's bookmarks
 */
export async function removeUserBookmark(fid: number, patternId: number): Promise<boolean> {
  try {
    const key = getUserBookmarksKey(fid);
    console.log(`[KV] Removing bookmark ${patternId} for key:`, key);
    const redis = getRedisClient();
    const result = await redis.srem(key, patternId);
    console.log("[KV] Successfully removed bookmark:", result);
    return result === 1; // Returns true if the pattern was removed
  } catch (error) {
    console.error("[KV] Error removing bookmark:", error);
    if (error instanceof Error) {
      console.error("[KV] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return false;
  }
}

/**
 * Check if a pattern is bookmarked by a user
 */
export async function isPatternBookmarked(fid: number, patternId: number): Promise<boolean> {
  try {
    const key = getUserBookmarksKey(fid);
    console.log(`[KV] Checking if pattern ${patternId} is bookmarked for key:`, key);
    const redis = getRedisClient();
    const result = await redis.sismember(key, patternId);
    console.log("[KV] Pattern bookmark status:", result);
    return result === 1;
  } catch (error) {
    console.error("[KV] Error checking bookmark status:", error);
    if (error instanceof Error) {
      console.error("[KV] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return false;
  }
}