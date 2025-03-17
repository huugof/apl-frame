import { Pattern } from "@/app/types";

/**
 * Service class for handling pattern-related operations
 */
export class PatternService {
    /**
     * Get the pattern for today
     */
    public static async getDailyPattern(): Promise<Pattern> {
        const host = process.env.NEXT_PUBLIC_HOST || "https://apl-frame.vercel.app";
        const response = await fetch(`${host}/api/patterns`);
        if (!response.ok) {
            throw new Error("Failed to fetch daily pattern");
        }
        const data = await response.json();
        return data.pattern;
    }

    /**
     * Generate an image for a pattern
     */
    public static async generatePatternImage(pattern: Pattern): Promise<string> {
        const response = await fetch("/api/generate-image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: `${pattern.imagePrompt}, professional architectural rendering, detailed, realistic`,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to generate image");
        }

        const data = await response.json();
        return data.imageUrl;
    }
} 