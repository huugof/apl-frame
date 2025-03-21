import { NextRequest, NextResponse } from "next/server";
import { FrameActionType, Pattern } from "@/app/types";
import { PatternService } from "@/app/services/pattern.service";
import { getRedisClient } from "@/lib/kv";

/**
 * Get the current run number for today
 * @returns The current run number (0-based)
 */
async function getCurrentRunNumber(): Promise<number> {
  const redis = await getRedisClient();
  const today = new Date();
  const dateKey = `run_count:${today.toISOString().split("T")[0]}`;
  
  // Get current run number without incrementing
  const runNumber = await redis.get<number>(dateKey) || 0;
  return runNumber - 1; // Convert to 0-based index
}

/**
 * Handle GET requests for initial frame load
 */
export async function GET(): Promise<NextResponse> {
    try {
        // Get the current pattern
        const pattern = await PatternService.getDailyPattern();
        
        return NextResponse.json({
            pattern,
            hideSplashScreen: true
        });
    } catch (error) {
        console.error("Error loading initial pattern:", error);
        return NextResponse.json({
            error: "Failed to load pattern"
        }, { status: 500 });
    }
}

/**
 * Handle POST requests for frame interactions
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const data = await req.json();
        const { untrustedData } = data;
        const { buttonIndex } = untrustedData;
        
        // Get the current run number and pattern
        const runNumber = await getCurrentRunNumber();
        const pattern = await PatternService.getDailyPattern(runNumber);
        
        // Base response with hideSplashScreen set to true
        const baseResponse = {
            hideSplashScreen: true
        };
        
        // Handle different button actions
        switch (buttonIndex) {
            case 1: // View Pattern
                return NextResponse.json({
                    ...baseResponse,
                    pattern,
                });
            case 2: // Generate Image
                const imageUrl = await PatternService.generatePatternImage(pattern);
                return NextResponse.json({
                    ...baseResponse,
                    pattern,
                    imageUrl,
                });
            case 3: // Share Pattern
                return NextResponse.json({
                    ...baseResponse,
                    message: `Share this pattern: ${pattern.title}`,
                    pattern,
                });
            default:
                return NextResponse.json({
                    error: "Invalid button index",
                }, { status: 400 });
        }
    } catch (error) {
        console.error("Error processing frame action:", error);
        return NextResponse.json({
            error: "Internal server error",
        }, { status: 500 });
    }
} 