import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

/**
 * Handle GET requests to view notification tokens
 * This endpoint is only available in development
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    // Initialize Redis client
    const redis = new Redis({
      url: process.env.KV_REST_API_URL || "",
      token: process.env.KV_REST_API_TOKEN || "",
    });

    // Get all keys that store notification tokens
    const keys = await redis.keys("notification_tokens:*");
    
    // Get all tokens for each URL
    const tokensByUrl: Record<string, string[]> = {};
    for (const key of keys) {
      const url = key.replace("notification_tokens:", "");
      const tokens = await redis.smembers(key);
      tokensByUrl[url] = tokens;
    }

    return NextResponse.json({ tokens: tokensByUrl });
  } catch (error) {
    console.error("Error fetching notification tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification tokens" },
      { status: 500 }
    );
  }
} 