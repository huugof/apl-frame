import { NextRequest, NextResponse } from "next/server";
import { FrameActionType, Pattern } from "@/app/types";
import { PatternService } from "@/app/services/pattern.service";

/**
 * Handle POST requests for frame interactions
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const data = await req.json();
        const { untrustedData } = data;
        const { buttonIndex } = untrustedData;
        
        const pattern = await PatternService.getDailyPattern();
        
        // Handle different button actions
        switch (buttonIndex) {
            case 1: // View Pattern
                return NextResponse.json({
                    pattern,
                });
            case 2: // Generate Image
                const imageUrl = await PatternService.generatePatternImage(pattern);
                return NextResponse.json({
                    pattern,
                    imageUrl,
                });
            case 3: // Share Pattern
                return NextResponse.json({
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