import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

/**
 * Handle POST requests to save notification details
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { url, token } = await req.json();

    if (!url || !token) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Redis client
    const redis = new Redis({
      url: process.env.KV_REST_API_URL || "",
      token: process.env.KV_REST_API_TOKEN || "",
    });

    // Save notification details
    // We'll use a Set to store unique tokens for each notification URL
    await redis.sadd(`notification_tokens:${url}`, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving notification details:", error);
    return NextResponse.json(
      { error: "Failed to save notification details" },
      { status: 500 }
    );
  }
} 