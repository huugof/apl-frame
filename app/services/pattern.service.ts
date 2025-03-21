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
        try {
            console.log("[PatternService] Getting daily pattern...");
            const redis = getRedisClient();
            const patternId = await getCurrentPatternId(redis);
            console.log("[PatternService] Got pattern ID:", patternId);
            
            const pattern = await this.getPatternById(patternId);
            
            if (!pattern) {
                console.error("[PatternService] Pattern not found for ID:", patternId);
                throw new Error(`Pattern with ID ${patternId} not found`);
            }
            
            console.log("[PatternService] Retrieved daily pattern:", {
                id: pattern.id,
                title: pattern.title
            });
            
            return pattern;
        } catch (error) {
            console.error("[PatternService] Error getting daily pattern:", error);
            throw error;
        }
    }

    /**
     * Get the previous pattern
     */
    public static async getPreviousPattern(): Promise<Pattern> {
        try {
            console.log("[PatternService] Getting previous pattern...");
            const redis = getRedisClient();
            const currentPatternId = await getCurrentPatternId(redis);
            console.log("[PatternService] Current pattern ID:", currentPatternId);
            
            const currentIndex = patterns.findIndex(p => p.id === currentPatternId);
            
            if (currentIndex === -1) {
                console.error("[PatternService] Current pattern not found for ID:", currentPatternId);
                throw new Error(`Current pattern with ID ${currentPatternId} not found`);
            }
            
            const previousIndex = (currentIndex - 1 + patterns.length) % patterns.length;
            const previousPattern = patterns[previousIndex];
            
            console.log("[PatternService] Retrieved previous pattern:", {
                id: previousPattern.id,
                title: previousPattern.title
            });
            
            return previousPattern;
        } catch (error) {
            console.error("[PatternService] Error getting previous pattern:", error);
            throw error;
        }
    }

    /**
     * Get the next pattern
     */
    public static async getNextPattern(): Promise<Pattern> {
        try {
            console.log("[PatternService] Getting next pattern...");
            const redis = getRedisClient();
            const patternId = await getNextPatternId(redis);
            console.log("[PatternService] Got next pattern ID:", patternId);
            
            const pattern = await this.getPatternById(patternId);
            
            if (!pattern) {
                console.error("[PatternService] Pattern not found for ID:", patternId);
                throw new Error(`Pattern with ID ${patternId} not found`);
            }
            
            console.log("[PatternService] Retrieved next pattern:", {
                id: pattern.id,
                title: pattern.title
            });
            
            return pattern;
        } catch (error) {
            console.error("[PatternService] Error getting next pattern:", error);
            throw error;
        }
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
        try {
            console.log("[PatternService] Generating image for pattern:", {
                id: pattern.id,
                title: pattern.title
            });
            
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
                console.error("[PatternService] Failed to generate image:", response.status);
                throw new Error("Failed to generate image");
            }

            const data = await response.json();
            console.log("[PatternService] Successfully generated image");
            return data.imageUrl;
        } catch (error) {
            console.error("[PatternService] Error generating image:", error);
            throw error;
        }
    }
} 