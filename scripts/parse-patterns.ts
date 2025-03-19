import fs from "fs";
import path from "path";
import { Pattern, parsePattern } from "../app/lib/types/Pattern";

interface ExtendedPattern extends Pattern {
  id: number;
  name: string;
  imagePrompt: string;
}

/**
 * Reads all pattern files from the patterns-source directory and parses them
 * @returns Array of parsed patterns
 */
async function parseAllPatterns(): Promise<ExtendedPattern[]> {
  const patternsDir = path.join(process.cwd(), "patterns-source", "Patterns");
  const files = fs.readdirSync(patternsDir);
  
  const patterns: ExtendedPattern[] = [];
  
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    
    const filePath = path.join(patternsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    
    try {
      const pattern = parsePattern(file, content);
      
      // Create image prompt
      const imagePrompt = `Architectural visualization of "${pattern.title}" - ${pattern.problem}, professional architectural rendering, detailed, realistic`;
      
      patterns.push({
        ...pattern,
        id: pattern.number,
        name: pattern.title,
        imagePrompt
      });
    } catch (error) {
      console.error(`Error parsing pattern file ${file}:`, error);
    }
  }
  
  // Sort patterns by number
  patterns.sort((a, b) => a.number - b.number);
  
  // Write the parsed patterns to the data file
  const outputPath = path.join(process.cwd(), "app", "data", "patterns.ts");
  const outputContent = `/**
 * Collection of patterns from Christopher Alexander's A Pattern Language
 */
export const patterns = ${JSON.stringify(patterns, null, 2)};
`;

  fs.writeFileSync(outputPath, outputContent);
  console.log(`Successfully parsed ${patterns.length} patterns`);
  
  return patterns;
}

// Run the parser
parseAllPatterns().catch(console.error); 