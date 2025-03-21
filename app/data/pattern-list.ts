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
 * Get the current index in the pattern list based on the date
 */
export function getCurrentPatternIndex(date: Date): number {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceEpoch = Math.floor(utcDate.getTime() / (1000 * 60 * 60 * 24));
  return daysSinceEpoch % patternList.length;
}

/**
 * Get the pattern ID for a given date
 */
export function getPatternIdForDate(date: Date): number {
  const index = getCurrentPatternIndex(date);
  return patternList[index];
}

/**
 * Get the next pattern ID in the sequence
 */
export function getNextPatternId(currentDate: Date): number {
  const currentIndex = getCurrentPatternIndex(currentDate);
  const nextIndex = (currentIndex + 1) % patternList.length;
  return patternList[nextIndex];
} 