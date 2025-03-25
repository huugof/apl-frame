import { NextRequest, NextResponse } from "next/server";
import { 
  addUserBookmark, 
  removeUserBookmark, 
  getUserBookmarks, 
  isPatternBookmarked 
} from "@/lib/kv";
import { z } from "zod";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

const bookmarkActionSchema = z.object({
  patternId: z.number(),
  action: z.enum(["add", "remove"])
});

/**
 * Get bookmarks for a user
 */
export async function GET(request: NextRequest) {
  console.log("[API] GET /api/bookmarks - Starting request");
  try {
    // Get the user's FID from the request headers
    const fid = request.headers.get("x-farcaster-fid");
    if (!fid) {
      console.error("[API] No FID found in request headers");
      return NextResponse.json(
        { error: "No FID provided" },
        { status: 400 }
      );
    }

    const patternId = request.nextUrl.searchParams.get("patternId");
    
    // If patternId is provided, check if it's bookmarked
    if (patternId) {
      const isBookmarked = await isPatternBookmarked(parseInt(fid, 10), parseInt(patternId, 10));
      return NextResponse.json({ isBookmarked });
    }
    
    // Otherwise, get all bookmarks
    const bookmarks = await getUserBookmarks(parseInt(fid, 10));
    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("[API] Failed to get bookmarks:", error);
    if (error instanceof Error) {
      console.error("[API] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: "Failed to get bookmarks" },
      { status: 500 }
    );
  }
}

/**
 * Add or remove a bookmark
 */
export async function POST(request: NextRequest) {
  console.log("[API] POST /api/bookmarks - Starting request");
  try {
    // Get the user's FID from the request headers
    const fid = request.headers.get("x-farcaster-fid");
    if (!fid) {
      console.error("[API] No FID found in request headers");
      return NextResponse.json(
        { error: "No FID provided" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsedBody = bookmarkActionSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error("[API] Invalid request body:", parsedBody.error.errors);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { patternId, action } = parsedBody.data;
    let success = false;

    if (action === "add") {
      success = await addUserBookmark(parseInt(fid, 10), patternId);
    } else {
      success = await removeUserBookmark(parseInt(fid, 10), patternId);
    }

    if (!success) {
      return NextResponse.json(
        { error: `Failed to ${action} bookmark` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to manage bookmark:", error);
    if (error instanceof Error) {
      console.error("[API] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: "Failed to manage bookmark" },
      { status: 500 }
    );
  }
} 