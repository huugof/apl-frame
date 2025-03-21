import { Redis } from "@upstash/redis";
import { getCurrentPatternId, getNextPatternId } from "@/app/data/pattern-list";
import { Pattern } from "@/app/types";
import { patterns } from "@/app/data/patterns";
import { getRedisClient } from "@/lib/kv";

/**
 * Service class for handling pattern-related operations
 */
export class PatternService {
    private static redis: Redis;

    /**
     * Initialize the Redis client
     */
    public static initialize(redis: Redis): void {
        PatternService.redis = redis;
    }

    /**
     * Get the current daily pattern
     */
    public static async getDailyPattern(): Promise<Pattern> {
        if (!PatternService.redis) {
            throw new Error("Redis client not initialized");
        }

        const patternId = await getCurrentPatternId(PatternService.redis);
        return {
            id: patternId,
            title: `Pattern ${patternId}`,
            name: `Pattern ${patternId}`,
            number: patternId,
            problem: "Loading pattern...",
            solution: "Loading pattern...",
            relatedPatterns: "Loading related patterns...",
            imagePrompt: "Loading image prompt..."
        };
    }

    /**
     * Get the current pattern
     */
    public static async getCurrentPattern(): Promise<Pattern> {
        try {
            console.log("[PatternService] Getting current pattern...");
            const redis = getRedisClient();
            const patternId = await getCurrentPatternId(redis);
            console.log("[PatternService] Got pattern ID:", patternId);
            
            const pattern = await this.getPatternById(patternId);
            
            if (!pattern) {
                console.error("[PatternService] Pattern not found for ID:", patternId);
                throw new Error(`Pattern with ID ${patternId} not found`);
            }
            
            console.log("[PatternService] Retrieved current pattern:", {
                id: pattern.id,
                title: pattern.title
            });
            
            return pattern;
        } catch (error) {
            console.error("[PatternService] Error getting current pattern:", error);
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
     * Generate an image for a given pattern
     */
    public static async generatePatternImage(pattern: Pattern): Promise<string> {
        // TODO: Implement image generation logic
        return `https://example.com/pattern-${pattern.id}.png`;
    }
}

// Mark this file as server-side only
export const runtime = "edge"; 