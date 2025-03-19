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
        if (result.notificationDetails) {
          await saveNotificationDetails(result.notificationDetails);
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
  const saveNotificationDetails = async (details: NotificationDetails) => {
    try {
      const response = await fetch("/api/notifications/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(details),
      });
      if (!response.ok) {
        throw new Error("Failed to save notification details");
      }
    } catch (error) {
      console.error("Error saving notification details:", error);
    }
  };

  /**
   * Send notification when a new pattern is available
   */
  const sendNewPatternNotification = async (newPattern: Pattern) => {
    try {
      // Skip notification sending during static generation
      if (typeof window === "undefined") {
        console.log("Skipping notification during static generation");
        return;
      }

      console.log("Fetching users with notifications...");
      const response = await fetch("/api/notifications/users", {
        method: "GET",
        cache: "no-store",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get notification users: ${response.status}`);
      }
      
      const users = await response.json();
      console.log(`Found ${users.length} users to notify`);
      
      // Send notification to each user
      for (const user of users) {
        console.log(`Sending notification to user ${user.fid}...`);
        const result = await sendFrameNotification({
          fid: user.fid,
          title: "New Pattern Available",
          body: `A new pattern is available: ${newPattern.title}`,
        });
        
        if (result.state === "success") {
          console.log(`Successfully sent notification to user ${user.fid}`);
        } else if (result.state === "no_token") {
          console.log(`No notification token found for user ${user.fid}`);
        } else if (result.state === "rate_limit") {
          console.log(`Rate limited when sending to user ${user.fid}`);
        } else {
          console.error(`Failed to send notification to user ${user.fid}:`, result.error);
        }
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
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
          sdk.on("frameAdded", ({ notificationDetails }) => {
            setHasAddedFrame(true);
            if (notificationDetails) {
              saveNotificationDetails(notificationDetails);
            }
          });

          sdk.on("frameRemoved", () => {
            setHasAddedFrame(false);
          });

          // Tell the client we're ready and can hide the splash screen
          sdk.actions.ready();

          // Prompt to add frame if not already added
          promptAddFrame();
        }
      } catch (error) {
        console.error("Failed to initialize frame:", error);
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
      console.log("Checking for new pattern...");
      const latestPattern = await PatternService.getDailyPattern();
      console.log("Latest pattern:", latestPattern);
      console.log("Current pattern:", pattern);
      
      if (pattern && latestPattern.id !== pattern.id) {
        console.log("New pattern detected! Sending notifications...");
        setNewPatternAvailable(true);
        // Send notification when new pattern is available
        await sendNewPatternNotification(latestPattern);
      } else {
        console.log("No new pattern available");
      }
    } catch (error) {
      console.error("Failed to check for new pattern:", error);
    }
  };

  // Check for minute changes
  useEffect(() => {
    const checkMinute = () => {
      const newMinute = Math.floor(new Date().getTime() / (1000 * 60));
      if (newMinute !== currentMinute) {
        setCurrentMinute(newMinute);
        checkForNewPattern();
      }
    };

    // Check every second for minute changes
    const intervalId = setInterval(checkMinute, 1000);

    // Initial load
    if (!pattern) {
      loadPattern();
    }

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [currentMinute, pattern]);

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