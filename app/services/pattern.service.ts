import { Pattern } from "@/app/types";

/**
 * Service class for handling pattern-related operations
 */
export class PatternService {
    /**
     * Get the pattern for today
     */
    public static async getDailyPattern(): Promise<Pattern> {
        const host = process.env.NEXT_PUBLIC_URL || "https://apl-frame.vercel.app";
        console.log("[PatternService] Fetching daily pattern from:", host);
        const response = await fetch(`${host}/api/patterns`);
        if (!response.ok) {
            console.error("[PatternService] Failed to fetch daily pattern:", response.status);
            throw new Error("Failed to fetch daily pattern");
        }
        const data = await response.json();
        console.log("[PatternService] Retrieved pattern:", {
            id: data.pattern.id,
            title: data.pattern.title
        });
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