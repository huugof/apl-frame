import { NextResponse } from "next/server";
import { getAllUsersWithNotifications } from "@/lib/kv";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

/**
 * Get all users who have enabled notifications
 */
export async function GET() {
  try {
    // Get all users with notification details
    const users = await getAllUsersWithNotifications();
    
    // Return the list of users
    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to get notification users:", error);
    return NextResponse.json(
      { error: "Failed to get notification users" },
      { status: 500 }
    );
  }
} 