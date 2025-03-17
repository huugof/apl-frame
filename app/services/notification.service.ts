import { Redis } from "@upstash/redis";

/**
 * Configuration interface for the NotificationService
 */
interface NotificationConfig {
  channelId: string;
  url: string;
  text: string;
  buttonText?: string;
  imageUrl?: string;
}

/**
 * Service to handle Farcaster notifications
 */
export class NotificationService {
  private static redis: Redis;
  private static readonly NOTIFICATION_KEY = "last_notification_sent";

  /**
   * Initialize the Redis client
   */
  private static initRedis(): void {
    if (!this.redis) {
      if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        throw new Error("Redis configuration is missing");
      }

      this.redis = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
    }
  }

  /**
   * Check if a notification was already sent today
   */
  private static async wasNotificationSentToday(): Promise<boolean> {
    this.initRedis();
    const lastSent = await this.redis.get(this.NOTIFICATION_KEY);
    if (!lastSent) return false;

    const lastSentDate = new Date(lastSent as string);
    const today = new Date();
    
    return (
      lastSentDate.getDate() === today.getDate() &&
      lastSentDate.getMonth() === today.getMonth() &&
      lastSentDate.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Record that a notification was sent
   */
  private static async recordNotificationSent(): Promise<void> {
    this.initRedis();
    await this.redis.set(this.NOTIFICATION_KEY, new Date().toISOString());
  }

  /**
   * Send a notification to Farcaster
   */
  public static async sendNotification(config: NotificationConfig): Promise<void> {
    // Check if we already sent a notification today
    if (await this.wasNotificationSentToday()) {
      console.log("Notification already sent today");
      return;
    }

    try {
      // Get the notification URL and token from environment variables
      const notificationUrl = process.env.FARCASTER_NOTIFICATION_URL;
      const notificationToken = process.env.FARCASTER_NOTIFICATION_TOKEN;

      if (!notificationUrl || !notificationToken) {
        throw new Error("Farcaster notification configuration is missing");
      }

      // Send the notification using the Farcaster Frame notification API
      const response = await fetch(notificationUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${notificationToken}`
        },
        body: JSON.stringify({
          notificationId: `pattern-${Date.now()}`,
          title: "New Pattern Available",
          body: config.text,
          targetUrl: config.url,
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.statusText}`);
      }

      // Record that we sent the notification
      await this.recordNotificationSent();
      
      console.log("Notification sent successfully");
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }
} 