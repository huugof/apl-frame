/**
 * Component that displays a random pattern that changes daily
 */
"use client";

import { useState, useEffect } from "react";
import { Pattern } from "@/app/types";
import { PatternService } from "@/app/services/pattern.service";
import PatternCard from "./PatternCard";
import sdk from "@farcaster/frame-sdk";
import { sendFrameNotification } from "@/lib/notifs";

interface NotificationDetails {
  url: string;
  token: string;
}

interface AddFrameResult {
  added: boolean;
  notificationDetails?: NotificationDetails;
  reason?: string;
  fid?: number;
}

interface FrameEvent {
  notificationDetails?: NotificationDetails;
  fid?: number;
}

export default function RandomPattern() {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(() => 
    Math.floor(new Date().getTime() / (1000 * 60))
  );
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [hasAddedFrame, setHasAddedFrame] = useState(false);
  const [newPatternAvailable, setNewPatternAvailable] = useState(false);

  const loadPattern = async () => {
    try {
      const dailyPattern = await PatternService.getDailyPattern();
      setPattern(dailyPattern);
      setNewPatternAvailable(false);
      // Reset image when pattern changes
      setImageUrl(null);
    } catch (error) {
      console.error("Failed to load pattern:", error);
    }
  };

  const generatePatternImage = async () => {
    if (!pattern) return;

    setIsLoading(true);
    try {
      const url = await PatternService.generatePatternImage(pattern);
      setImageUrl(url);
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Prompt user to add the frame and enable notifications
   */
  const promptAddFrame = async () => {
    try {
      const result = await sdk.actions.addFrame() as AddFrameResult;
      if (result.added) {
        setHasAddedFrame(true);
        // Save notification details if provided
        if (result.notificationDetails && result.fid) {
          await saveNotificationDetails(result.notificationDetails, result.fid);
        }
      } else if (result.reason) {
        console.log("Frame not added:", result.reason);
      }
    } catch (error) {
      console.error("Error adding frame:", error);
    }
  };

  /**
   * Save notification details to your backend
   */
  const saveNotificationDetails = async (details: NotificationDetails, fid: number) => {
    try {
      console.log(`[Frame] Saving notification details for user ${fid}...`);
      const response = await fetch("/api/notifications/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-farcaster-fid": fid.toString(),
        },
        body: JSON.stringify(details),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to save notification details: ${errorData.error || response.status}`);
      }
      
      console.log("[Frame] Successfully saved notification details");
    } catch (error) {
      console.error("[Frame] Error saving notification details:", error);
      // Don't throw here, just log the error
    }
  };

  const sendNewPatternNotification = async (pattern: Pattern) => {
    try {
      console.log("[NOTIF] Sending new pattern notification");
      
      // First, get all users with notifications
      const response = await fetch("/api/notifications/users");
      if (!response.ok) {
        const errorData = await response.json();
        console.error("[NOTIF] Failed to get users with notifications:", errorData);
        return;
      }

      const users = await response.json();
      console.log(`[NOTIF] Found ${users.length} users with notifications`);

      // Send notification to each user
      for (const user of users) {
        try {
          console.log(`[NOTIF] Sending notification to user ${user.fid}`);
          const notificationResponse = await fetch("/api/send-notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fid: user.fid,
              notificationDetails: user.details,
            }),
          });

          if (!notificationResponse.ok) {
            const errorData = await notificationResponse.json();
            console.error(`[NOTIF] Failed to send notification to user ${user.fid}:`, errorData);
            continue;
          }

          const data = await notificationResponse.json();
          console.log(`[NOTIF] Successfully sent notification to user ${user.fid}:`, data);
        } catch (error) {
          console.error(`[NOTIF] Error sending notification to user ${user.fid}:`, error);
        }
      }
    } catch (error) {
      console.error("[NOTIF] Error in notification process:", error);
    }
  };

  // Initialize Frame SDK and load pattern
  useEffect(() => {
    const initializeFrame = async () => {
      try {
        // Load pattern first
        await loadPattern();
        
        // Initialize Frame SDK
        if (sdk && !isSDKLoaded) {
          setIsSDKLoaded(true);

          // Set up event listeners
          sdk.on("frameAdded", async (event: FrameEvent) => {
            console.log("[Frame] Frame added event received");
            setHasAddedFrame(true);
            if (event.notificationDetails && event.fid) {
              console.log(`[Frame] Notification details received for user ${event.fid}, saving...`);
              await saveNotificationDetails(event.notificationDetails, event.fid);
            } else {
              console.log("[Frame] No notification details or FID received");
            }
          });

          sdk.on("frameRemoved", () => {
            console.log("[Frame] Frame removed event received");
            setHasAddedFrame(false);
          });

          // Tell the client we're ready and can hide the splash screen
          sdk.actions.ready();

          // Prompt to add frame if not already added
          promptAddFrame();
        }
      } catch (error) {
        console.error("[Frame] Failed to initialize frame:", error);
      }
    };

    initializeFrame();

    // Cleanup event listeners
    return () => {
      if (sdk) {
        sdk.removeAllListeners();
      }
    };
  }, [isSDKLoaded]);

  // Check for new patterns without loading them
  const checkForNewPattern = async () => {
    try {
      console.log("[Pattern] Checking for new pattern...");
      const latestPattern = await PatternService.getDailyPattern();
      
      // Log detailed pattern information
      console.log("[Pattern] Latest pattern:", {
        id: latestPattern.id,
        title: latestPattern.title
      });
      
      if (pattern) {
        console.log("[Pattern] Current pattern:", {
          id: pattern.id,
          title: pattern.title
        });
        
        // Compare pattern IDs
        const isNewPattern = latestPattern.id !== pattern.id;
        console.log("[Pattern] Is new pattern?", isNewPattern);
        
        if (isNewPattern) {
          console.log("[Pattern] New pattern detected! Sending notifications...");
          setNewPatternAvailable(true);
          await sendNewPatternNotification(latestPattern);
        } else {
          console.log("[Pattern] No new pattern available");
        }
      } else {
        console.log("[Pattern] No current pattern to compare against");
        // If no pattern exists, treat it as a new pattern
        setNewPatternAvailable(true);
        await sendNewPatternNotification(latestPattern);
      }
    } catch (error) {
      console.error("[Pattern] Failed to check for new pattern:", error);
      if (error instanceof Error) {
        console.error("[Pattern] Error details:", {
          message: error.message,
          stack: error.stack
        });
      }
    }
  };

  // Check for minute changes
  useEffect(() => {
    const checkMinute = () => {
      const newMinute = Math.floor(new Date().getTime() / (1000 * 60));
      if (newMinute !== currentMinute) {
        console.log(`[Pattern] Minute changed from ${currentMinute} to ${newMinute}`);
        setCurrentMinute(newMinute);
        checkForNewPattern();
      }
    };

    // Check every second for minute changes
    const intervalId = setInterval(checkMinute, 1000);

    // Initial check
    checkMinute();

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [currentMinute]); // Remove pattern from dependencies

  if (!pattern) {
    return <div>Loading pattern...</div>;
  }

  return (
    <div className="relative">
      {newPatternAvailable && (
        <button
          onClick={loadPattern}
          className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 
                   px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full shadow-lg
                   hover:bg-blue-600 transition-colors"
        >
          New pattern available
        </button>
      )}
      <PatternCard
        pattern={pattern}
        imageUrl={imageUrl}
        isLoading={isLoading}
        onGenerateImage={generatePatternImage}
      />
    </div>
  );
} 