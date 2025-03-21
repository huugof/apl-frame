import { Redis } from "@upstash/redis";

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
 * Get the current pattern ID from Redis
 */
export async function getCurrentPatternId(redis: Redis): Promise<number> {
  const currentIndexStr = await redis.get<string>("apl-daily:current-index");
  
  // If no index exists in Redis, initialize it to 0
  if (!currentIndexStr) {
    await redis.set<string>("apl-daily:current-index", "0");
    return patternList[0];
  }
  
  const currentIndex = parseInt(currentIndexStr, 10);
  return patternList[currentIndex];
}

/**
 * Get the next pattern ID and update Redis
 */
export async function getNextPatternId(redis: Redis): Promise<number> {
  const currentIndexStr = await redis.get<string>("apl-daily:current-index");
  const currentIndex = currentIndexStr ? parseInt(currentIndexStr, 10) : 0;
  const nextIndex = (currentIndex + 1) % patternList.length;
  
  // Update the current index in Redis
  await redis.set<string>("apl-daily:current-index", nextIndex.toString());
  
  return patternList[nextIndex];
} 