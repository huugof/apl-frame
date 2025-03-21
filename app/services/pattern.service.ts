import { Pattern } from "@/app/types";
import { patterns } from "@/app/data/patterns";

/**
 * Get a deterministic pattern for a given UTC date
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getPatternForDate(date: Date): Pattern {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceEpoch = Math.floor(utcDate.getTime() / (1000 * 60 * 60 * 24));
  const index = Math.floor(seededRandom(daysSinceEpoch) * patterns.length);
  return patterns[index];
}

/**
 * Service class for handling pattern-related operations
 */
export class PatternService {
    /**
     * Get the pattern for today
     */
    public static async getDailyPattern(): Promise<Pattern> {
        // Get today's pattern using the same logic as the cron job
        const today = new Date();
        const pattern = getPatternForDate(today);
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
        const pattern = getPatternForDate(yesterday);
        console.log("[PatternService] Retrieved previous pattern:", {
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