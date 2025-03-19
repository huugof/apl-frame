import { NextResponse } from "next/server";
import { getAllUsersWithNotifications } from "@/lib/kv";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

/**
 * Get all users who have enabled notifications
 */
export async function GET() {
  console.log("[API] GET /api/notifications/users - Starting request");
  try {
    // Get all users with notification details
    console.log("[API] Fetching users with notifications from KV store");
    const users = await getAllUsersWithNotifications();
    console.log(`[API] Found ${users.length} users with notifications`);
    
    // Log user IDs for debugging (without sensitive data)
    const userIds = users.map(user => user.fid);
    console.log("[API] User IDs with notifications:", userIds);
    
    // Return the list of users
    return NextResponse.json(users);
  } catch (error) {
    console.error("[API] Failed to get notification users:", error);
    // Log additional error details
    if (error instanceof Error) {
      console.error("[API] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: "Failed to get notification users" },
      { status: 500 }
    );
  }
} 