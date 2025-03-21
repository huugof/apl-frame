import { Pattern } from "@/app/types";
import { patterns } from "@/app/data/patterns";
import { getCurrentPatternId, getNextPatternId } from "@/app/data/pattern-list";
import { getRedisClient } from "@/lib/kv";

/**
 * Service class for handling pattern-related operations
 */
export class PatternService {
    /**
     * Get the current pattern
     */
    public static async getDailyPattern(): Promise<Pattern> {
        const redis = getRedisClient();
        const patternId = await getCurrentPatternId(redis);
        const pattern = await this.getPatternById(patternId);
        
        if (!pattern) {
            throw new Error(`Pattern with ID ${patternId} not found`);
        }
        
        console.log("[PatternService] Retrieved daily pattern:", {
            id: pattern.id,
            title: pattern.title
        });
        
        return pattern;
    }

    /**
     * Get the previous pattern
     */
    public static async getPreviousPattern(): Promise<Pattern> {
        const redis = getRedisClient();
        const currentPatternId = await getCurrentPatternId(redis);
        const currentIndex = patterns.findIndex(p => p.id === currentPatternId);
        
        if (currentIndex === -1) {
            throw new Error(`Current pattern with ID ${currentPatternId} not found`);
        }
        
        const previousIndex = (currentIndex - 1 + patterns.length) % patterns.length;
        const previousPattern = patterns[previousIndex];
        
        console.log("[PatternService] Retrieved previous pattern:", {
            id: previousPattern.id,
            title: previousPattern.title
        });
        
        return previousPattern;
    }

    /**
     * Get the next pattern
     */
    public static async getNextPattern(): Promise<Pattern> {
        const redis = getRedisClient();
        const patternId = await getNextPatternId(redis);
        const pattern = await this.getPatternById(patternId);
        
        if (!pattern) {
            throw new Error(`Pattern with ID ${patternId} not found`);
        }
        
        console.log("[PatternService] Retrieved next pattern:", {
            id: pattern.id,
            title: pattern.title
        });
        
        return pattern;
    }

    /**
     * Get a pattern by ID
     */
    public static async getPatternById(id: number): Promise<Pattern | undefined> {
        return patterns.find(p => p.id === id);
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