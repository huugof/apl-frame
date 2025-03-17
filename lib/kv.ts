import { Redis } from "@upstash/redis";

/**
 * Redis client configuration using Upstash
 */
export const redis = new Redis({
  url: process.env.KV_REST_API_URL as string,
  token: process.env.KV_REST_API_TOKEN as string,
});

/**
 * Type definitions for key-value operations
 */
export interface KVOperations {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, expirationSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/**
 * Implementation of KV operations using Redis
 */
export class KVStore implements KVOperations {
  /**
   * Retrieves a value from Redis by key
   * @param key - The key to look up
   * @returns The value if found, null otherwise
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get<T>(key);
      return value;
    } catch (error) {
      console.error("Error retrieving from Redis:", error);
      throw new Error("Failed to retrieve value from Redis");
    }
  }

  /**
   * Sets a value in Redis with optional expiration
   * @param key - The key to set
   * @param value - The value to store
   * @param expirationSeconds - Optional TTL in seconds
   */
  public async set<T>(
    key: string,
    value: T,
    expirationSeconds?: number
  ): Promise<void> {
    try {
      if (expirationSeconds) {
        await redis.set(key, value, { ex: expirationSeconds });
      } else {
        await redis.set(key, value);
      }
    } catch (error) {
      console.error("Error setting value in Redis:", error);
      throw new Error("Failed to set value in Redis");
    }
  }

  /**
   * Deletes a key from Redis
   * @param key - The key to delete
   */
  public async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error("Error deleting from Redis:", error);
      throw new Error("Failed to delete value from Redis");
    }
  }

  /**
   * Checks if a key exists in Redis
   * @param key - The key to check
   * @returns boolean indicating if key exists
   */
  public async exists(key: string): Promise<boolean> {
    try {
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error("Error checking existence in Redis:", error);
      throw new Error("Failed to check key existence in Redis");
    }
  }
}

// Export singleton instance
export const kv = new KVStore(); 