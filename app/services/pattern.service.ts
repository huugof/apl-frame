import { Pattern } from "@/app/types";
import { patterns } from "@/app/data/patterns";
import { getPatternIdForDate, getNextPatternId } from "@/app/data/pattern-list";

/**
 * Service class for handling pattern-related operations
 */
export class PatternService {
    /**
     * Get the pattern for today
     */
    public static async getDailyPattern(): Promise<Pattern> {
        // Get today's pattern using the pattern list
        const today = new Date();
        const patternId = getPatternIdForDate(today);
        const pattern = patterns.find(p => p.id === patternId);
        
        if (!pattern) {
            throw new Error(`Pattern with ID ${patternId} not found`);
        }

        console.log("[PatternService] Retrieved pattern:", {
            id: pattern.id,
            title: pattern.title
        });
        return pattern;
    }

    /**
     * Get the pattern for yesterday (used for checking changes)
     */
    public static async getPreviousPattern(): Promise<Pattern> {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const patternId = getPatternIdForDate(yesterday);
        const pattern = patterns.find(p => p.id === patternId);
        
        if (!pattern) {
            throw new Error(`Pattern with ID ${patternId} not found`);
        }

        console.log("[PatternService] Retrieved previous pattern:", {
            id: pattern.id,
            title: pattern.title
        });
        return pattern;
    }

    /**
     * Get the next pattern in the sequence
     */
    public static async getNextPattern(): Promise<Pattern> {
        const today = new Date();
        const nextPatternId = getNextPatternId(today);
        const pattern = patterns.find(p => p.id === nextPatternId);
        
        if (!pattern) {
            throw new Error(`Pattern with ID ${nextPatternId} not found`);
        }

        console.log("[PatternService] Retrieved next pattern:", {
            id: pattern.id,
            title: pattern.title
        });
        return pattern;
    }

    /**
     * Get a pattern by its ID
     */
    public static async getPatternById(id: number): Promise<Pattern | null> {
        return patterns.find(p => p.id === id) || null;
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