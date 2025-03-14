const fs = require('fs');
const path = require('path');

const patternsDir = path.join(__dirname, '../patterns-source/Patterns');
const outputFile = path.join(__dirname, '../app/data/patterns.ts');

// Read all markdown files from the patterns directory
const patternFiles = fs.readdirSync(patternsDir)
  .filter(file => file.endsWith('.md'));

const patterns = patternFiles.map((file) => {
  const content = fs.readFileSync(path.join(patternsDir, file), 'utf8');
  
  // Extract pattern number from filename
  const patternNumber = file.match(/\((\d+)\)/)?.[1];
  
  // Split content into lines
  const lines = content.split('\n');
  
  // Extract title (first line after removing #)
  const title = lines[0].replace('#', '').trim();
  
  // Find problem and solution sections
  let problem = '';
  let solution = '';
  let currentSection = '';
  let isCollectingProblem = false;
  let isCollectingSolution = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines at the start
    if (!currentSection && !line) continue;
    
    // Check for section markers
    if (line.match(/^[*…]+$/)) {
      if (!isCollectingProblem && !isCollectingSolution) {
        isCollectingProblem = true;
      } else if (isCollectingProblem) {
        isCollectingProblem = false;
        isCollectingSolution = true;
      }
      continue;
    }

    // Collect content for the current section
    if (isCollectingProblem) {
      problem += line + '\n';
    } else if (isCollectingSolution) {
      solution += line + '\n';
    } else if (!isCollectingProblem && !isCollectingSolution && !currentSection) {
      currentSection = line;
    }
  }

  // Clean up the sections
  problem = problem.trim();
  solution = solution.trim();
  
  // Create image prompt from the problem statement
  const imagePrompt = `Architectural visualization of "${title}" - ${problem.split('.')[0]}, professional architectural rendering, detailed, realistic`;
  
  return {
    id: parseInt(patternNumber, 10),
    name: title,
    context: currentSection,
    problem,
    solution,
    imagePrompt,
    sourceFile: file,
  };
}).sort((a, b) => a.id - b.id); // Sort patterns by their number

// Generate TypeScript file
const tsContent = `/**
 * Represents a single architectural pattern from A Pattern Language
 */
export interface Pattern {
  id: number;
  name: string;
  context: string;
  problem: string;
  solution: string;
  imagePrompt: string;
  sourceFile: string;
}

/**
 * Collection of patterns from Christopher Alexander's A Pattern Language
 */
export const patterns: Pattern[] = ${JSON.stringify(patterns, null, 2)};
`;

// Write the TypeScript file
fs.writeFileSync(outputFile, tsContent);
console.log(`Generated ${patterns.length} patterns in ${outputFile}`); 