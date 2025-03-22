import { NextRequest, NextResponse } from "next/server";
import { FrameActionType, Pattern } from "@/app/types";
import { PatternService } from "@/app/services/pattern.service";
import { getRedisClient } from "@/lib/kv";

/**
 * Handle POST requests for frame interactions
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const data = await req.json();
        const { untrustedData } = data;
        const { buttonIndex, patternId } = untrustedData;
        
        // Initialize Redis client
        const redis = getRedisClient();
        PatternService.initialize(redis);
        
        // Get the requested pattern or default to daily pattern
        const pattern = patternId 
            ? await PatternService.getPatternById(parseInt(patternId, 10))
            : await PatternService.getDailyPattern();
            
        if (!pattern) {
            return NextResponse.json({
                error: "Pattern not found",
            }, { status: 404 });
        }
        
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