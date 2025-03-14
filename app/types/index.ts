/**
 * Types and interfaces for the Pattern Language Frame application
 */

/**
 * Represents a pattern from "A Pattern Language"
 */
export interface Pattern {
    /** The unique identifier of the pattern */
    id: number;
    /** The title of the pattern */
    title: string;
    /** The name of the pattern */
    name: string;
    /** A brief summary of the pattern */
    summary: string;
    /** The problem statement */
    problem: string;
    /** The solution statement */
    solution: string;
    /** The related patterns and their references */
    relatedPatterns?: string;
    /** The URL of the generated image */
    imageUrl?: string;
    /** The prompt used to generate the image */
    imagePrompt: string;
}

/**
 * Frame state for managing user interactions
 */
export interface FrameState {
    currentPatternId: number;
    lastUpdated: string;
    viewCount: number;
}

/**
 * Frame action types
 */
export enum FrameActionType {
    VIEW_PATTERN = "VIEW_PATTERN",
    GENERATE_IMAGE = "GENERATE_IMAGE",
    SHARE_PATTERN = "SHARE_PATTERN"
}

/**
 * Frame metadata for rendering
 */
export interface FrameMetadata {
    buttons: Array<{
        label: string;
        action: FrameActionType;
    }>;
    image: {
        url: string;
        aspectRatio?: "1:1" | "1.91:1";
    };
    input?: {
        text?: string;
    };
    postUrl: string;
} 