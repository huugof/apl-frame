/**
 * Shuffle an array using the Fisher-Yates algorithm with a seed
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Use the seed to generate a random number between 0 and i
    const x = Math.sin(seed + i) * 10000;
    const j = Math.floor((x - Math.floor(x)) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Random list of pattern IDs for cycling through patterns
 */
export const patternList: number[] = seededShuffle(
  Array.from({ length: 253 }, (_, i) => i + 1),
  39241012
);

/**
 * Get the current pattern ID based on the date
 */
export function getCurrentPatternId(date: Date = new Date()): number {
  // Get the number of days since epoch
  const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  // Use modulo to cycle through the pattern list
  const currentIndex = daysSinceEpoch % patternList.length;
  return patternList[currentIndex];
}

/**
 * Get the next pattern ID
 */
export function getNextPatternId(date: Date = new Date()): number {
  // Get the number of days since epoch
  const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  // Use modulo to cycle through the pattern list, adding 1 to get the next pattern
  const nextIndex = (daysSinceEpoch + 1) % patternList.length;
  return patternList[nextIndex];
} 