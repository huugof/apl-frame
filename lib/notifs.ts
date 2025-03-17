import { kv } from "./kv";

/**
 * Type definition for a notification
 */
export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  createdAt: number;
  read: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Type for notification creation parameters
 */
export type CreateNotificationParams = Omit<Notification, "id" | "createdAt" | "read">;

/**
 * Class to handle notification operations
 */
export class NotificationManager {
  private static readonly NOTIFICATION_PREFIX = "notification:";
  private static readonly USER_NOTIFICATIONS_PREFIX = "user-notifications:";

  /**
   * Creates a new notification
   * @param params - Notification parameters
   * @returns The created notification
   */
  public async createNotification(params: CreateNotificationParams): Promise<Notification> {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      read: false,
      ...params,
    };

    const key = `${NotificationManager.NOTIFICATION_PREFIX}${notification.id}`;
    await kv.set(key, notification);

    // Add to user's notification list
    const userKey = `${NotificationManager.USER_NOTIFICATIONS_PREFIX}${notification.userId}`;
    const userNotifications = await this.getUserNotificationIds(notification.userId);
    userNotifications.unshift(notification.id);
    await kv.set(userKey, userNotifications);

    return notification;
  }

  /**
   * Retrieves a notification by ID
   * @param id - Notification ID
   * @returns The notification if found
   */
  public async getNotification(id: string): Promise<Notification | null> {
    const key = `${NotificationManager.NOTIFICATION_PREFIX}${id}`;
    return await kv.get<Notification>(key);
  }

  /**
   * Marks a notification as read
   * @param id - Notification ID
   */
  public async markAsRead(id: string): Promise<void> {
    const notification = await this.getNotification(id);
    if (!notification) {
      throw new Error("Notification not found");
    }

    const key = `${NotificationManager.NOTIFICATION_PREFIX}${id}`;
    await kv.set(key, { ...notification, read: true });
  }

  /**
   * Gets all notification IDs for a user
   * @param userId - User ID
   * @returns Array of notification IDs
   */
  private async getUserNotificationIds(userId: string): Promise<string[]> {
    const key = `${NotificationManager.USER_NOTIFICATIONS_PREFIX}${userId}`;
    const notifications = await kv.get<string[]>(key);
    return notifications || [];
  }

  /**
   * Gets all notifications for a user
   * @param userId - User ID
   * @returns Array of notifications
   */
  public async getUserNotifications(userId: string): Promise<Notification[]> {
    const notificationIds = await this.getUserNotificationIds(userId);
    const notifications = await Promise.all(
      notificationIds.map((id) => this.getNotification(id))
    );
    return notifications.filter((n): n is Notification => n !== null);
  }

  /**
   * Deletes a notification
   * @param id - Notification ID
   */
  public async deleteNotification(id: string): Promise<void> {
    const notification = await this.getNotification(id);
    if (!notification) {
      return;
    }

    // Remove from notification storage
    const key = `${NotificationManager.NOTIFICATION_PREFIX}${id}`;
    await kv.del(key);

    // Remove from user's notification list
    const userKey = `${NotificationManager.USER_NOTIFICATIONS_PREFIX}${notification.userId}`;
    const userNotifications = await this.getUserNotificationIds(notification.userId);
    const updatedNotifications = userNotifications.filter((nId) => nId !== id);
    await kv.set(userKey, updatedNotifications);
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager(); 