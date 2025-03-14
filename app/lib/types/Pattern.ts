/**
 * Represents a pattern from A Pattern Language
 */
export interface Pattern {
    /** The title of the pattern */
    title: string;
    /** The pattern number */
    number: number;
    /** The problem statement */
    problem: string;
    /** The solution statement */
    solution: string;
    /** Related patterns with their references */
    relatedPatterns: string;
}

/**
 * Parses a markdown file content into a Pattern object
 * @param fileName - The name of the file (e.g., "Animals (74).md")
 * @param content - The content of the markdown file
 * @returns A Pattern object containing the parsed information
 * @throws Error if the file name or content is not in the expected format
 */
export function parsePattern(fileName: string, content: string): Pattern {
    // Parse title and number from filename
    const fileNameMatch = fileName.match(/^(.+?)\s*\((\d+)\)\.md$/);
    if (!fileNameMatch) {
        throw new Error(`Invalid pattern file name format: ${fileName}`);
    }

    const [, title, numberStr] = fileNameMatch;
    const number = parseInt(numberStr, 10);

    // Extract sections using regex
    const problemMatch = content.match(/### Problem\s*\n([^#]*)/);
    const solutionMatch = content.match(/### Solution\s*\n([^#]*)/);
    const relatedPatternsMatch = content.match(/### Related Patterns\s*\n([^#]*)/);

    if (!problemMatch || !solutionMatch) {
        throw new Error("Missing required Problem or Solution section");
    }

    // Clean up the extracted text (remove '>' and trim)
    const cleanText = (text: string): string => {
        return text
            .split("\n")
            .map(line => line.replace(/^>\s*/, "").trim())
            .filter(line => line.length > 0)
            .join("\n");
    };

    return {
        title: title.trim(),
        number,
        problem: cleanText(problemMatch[1]),
        solution: cleanText(solutionMatch[1]),
        relatedPatterns: relatedPatternsMatch ? cleanText(relatedPatternsMatch[1]) : "",
    };
} 