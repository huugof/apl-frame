import { Pattern } from "@/app/types";
import { patterns } from "@/app/data/patterns";

/**
 * Get a deterministic pattern for a given UTC date and run number
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Get a pattern based on date and run number
 * @param date - The date to get the pattern for
 * @param runNumber - The run number for this date (0-based)
 */
function getPatternForDateAndRun(date: Date, runNumber: number): Pattern {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceEpoch = Math.floor(utcDate.getTime() / (1000 * 60 * 60 * 24));
  // Combine days since epoch with run number to create a unique seed
  const seed = daysSinceEpoch * 1000 + runNumber;
  const index = Math.floor(seededRandom(seed) * patterns.length);
  return patterns[index];
}

/**
 * Service class for handling pattern-related operations
 */
export class PatternService {
    /**
     * Get the pattern for today
     * @param runNumber - The run number for today (0-based)
     */
    public static async getDailyPattern(runNumber: number = 0): Promise<Pattern> {
        const today = new Date();
        const pattern = getPatternForDateAndRun(today, runNumber);
        console.log("[PatternService] Retrieved pattern:", {
            pattern,
            runNumber,
            date: today.toISOString()
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
        const pattern = getPatternForDateAndRun(yesterday, 0);
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