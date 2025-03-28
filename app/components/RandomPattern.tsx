/**
 * Component that displays a random pattern that changes daily
 */
"use client";

import { useState, useEffect, MouseEvent, useCallback, useRef } from "react";
import { Pattern } from "@/app/types";
import PatternCard from "./PatternCard";
import sdk from "@farcaster/frame-sdk";
import { sendFrameNotification } from "@/lib/notifs";
import { useSearchParams } from "next/navigation";

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

interface RandomPatternProps {
  initialPatternId?: number;
}

/**
 * Parse wikilinks from pattern text
 */
function parseWikilinks(text: string): Array<{ id: number; title: string }> {
  const wikilinkRegex = /\[\[(.*?) \((\d+)\)\]\]/g;
  const matches = text.matchAll(wikilinkRegex);
  return Array.from(matches).map(match => ({
    title: match[1],
    id: parseInt(match[2], 10)
  }));
}

export default function RandomPattern({ initialPatternId }: RandomPatternProps) {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [hasAddedFrame, setHasAddedFrame] = useState(false);
  const [newPatternAvailable, setNewPatternAvailable] = useState(false);
  const [relatedPatterns, setRelatedPatterns] = useState<Array<{ id: number; title: string }>>([]);
  const searchParams = useSearchParams();
  const appUrl = process.env.NEXT_PUBLIC_URL;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);

  // Effect to handle scrolling when pattern changes
  useEffect(() => {
    if (shouldScrollToTop && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      setShouldScrollToTop(false);
    }
  }, [shouldScrollToTop]);

  /**
   * Load a pattern by ID
   */
  const loadPattern = async (patternId?: number) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/frame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          untrustedData: {
            buttonIndex: 1,
            patternId
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to load pattern");
      }
      
      const data = await response.json();
      setPattern(data.pattern);
      setNewPatternAvailable(false);
      
      // Parse related patterns from wikilinks
      const related = parseWikilinks(data.pattern.relatedPatterns);
      setRelatedPatterns(related);
    } catch (error) {
      console.error("Failed to load pattern:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate an image for the current pattern
   */
  const generatePatternImage = async () => {
    if (!pattern) return;
    
    try {
      setIsLoading(true);
      const response = await fetch("/api/frame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          untrustedData: {
            buttonIndex: 2,
            patternId: pattern.id
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate image");
      }
      
      const data = await response.json();
      setImageUrl(data.imageUrl);
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Navigate to a related pattern
   */
  const navigateToPattern = async (patternId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/frame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          untrustedData: {
            buttonIndex: 1,
            patternId
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to load pattern");
      }
      
      const data = await response.json();
      setPattern(data.pattern);
      setImageUrl(null);
      
      // Parse related patterns from wikilinks
      const related = parseWikilinks(data.pattern.relatedPatterns);
      setRelatedPatterns(related);

      // Trigger scroll after state updates
      setShouldScrollToTop(true);
    } catch (error) {
      console.error("Failed to navigate to pattern:", error);
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

  /**
   * Generate a Warpcast cast URL with frame embed
   */
  const generateShareUrl = useCallback((): string => {
    if (!pattern || !appUrl) return "";
    
    // Create the frame embed URL with the current pattern ID
    const frameUrl = `${appUrl}/frames/pattern/${pattern.id}`;
    
    // Create the Warpcast cast URL with the frame embed
    const warpcastUrl = new URL("https://warpcast.com/~/compose");
    warpcastUrl.searchParams.set("text", `Check out Pattern ${pattern.number}: ${pattern.title} from A Pattern Language`);
    warpcastUrl.searchParams.set("embeds[]", frameUrl);
    
    return warpcastUrl.toString();
  }, [pattern, appUrl]);

  /**
   * Open Warpcast compose dialog
   */
  const openWarpcastUrl = useCallback(() => {
    const shareUrl = generateShareUrl();
    if (shareUrl) {
      sdk.actions.openUrl(shareUrl);
    }
  }, [generateShareUrl]);

  /**
   * Handle share button click
   */
  const handleShareClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await openWarpcastUrl();
  };

  /**
   * Handle new pattern button click
   */
  const handleNewPatternClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await loadPattern();
  };

  // Initialize Frame SDK and load pattern
  useEffect(() => {
    const initializeFrame = async () => {
      try {
        // Get pattern ID from URL if present, otherwise use initialPatternId
        const patternId = searchParams.get("patternId") || initialPatternId?.toString();
        
        // Load pattern first
        await loadPattern(patternId ? parseInt(patternId, 10) : undefined);
        
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

          // Only prompt to add frame if we're not in an embedded view
          if (!initialPatternId) {
            promptAddFrame();
          }
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
  }, [isSDKLoaded, searchParams, initialPatternId]);

  // Check for new patterns every minute
  useEffect(() => {
    let lastPatternId: number | null = null;

    const checkForNewPattern = async () => {
      try {
        const response = await fetch("/api/pattern/current");
        if (!response.ok) {
          throw new Error("Failed to check pattern");
        }
        const data = await response.json();
        
        // Only show the notification if we have a previous pattern and the new one is different
        if (lastPatternId !== null && data.pattern.id !== lastPatternId) {
          console.log("[Pattern] New pattern detected:", {
            oldId: lastPatternId,
            newId: data.pattern.id
          });
          setNewPatternAvailable(true);
        }
        
        lastPatternId = data.pattern.id;
      } catch (error) {
        console.error("Failed to check for new pattern:", error);
      }
    };

    // Check immediately
    checkForNewPattern();

    // Then check every minute
    const interval = setInterval(checkForNewPattern, 60000);

    return () => clearInterval(interval);
  }, []); // Remove pattern dependency to avoid unnecessary re-renders

  if (!pattern) {
    return <div>Loading pattern...</div>;
  }

  return (
    <div className="relative h-screen">
      {newPatternAvailable && (
        <button
          onClick={handleNewPatternClick}
          className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 
                   px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full shadow-lg
                   hover:bg-blue-600 transition-colors"
        >
          New pattern available
        </button>
      )}
      
      <div ref={scrollContainerRef} className="h-[calc(100vh-90px)] overflow-y-auto shadow-lg rounded-b-[2rem]">
        <div className="flex flex-col items-center">
          <PatternCard
            pattern={pattern}
            imageUrl={imageUrl}
            isLoading={isLoading}
            onGenerateImage={generatePatternImage}
            onNavigateToPattern={navigateToPattern}
            relatedPatterns={relatedPatterns}
          />
        </div>
      </div>

      <div className="fixed bottom-7 left-0 right-0 flex justify-center gap-4">
        <button
          onClick={() => loadPattern()}
          className="px-4 py-3 bg-[#fff] text-white shadow-xl rounded-full flex items-center gap-1 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium">✨</span>
        </button>
        <button
          onClick={handleShareClick}
          className="px-10 py-3 bg-[#696969] text-white shadow-xl rounded-full hover:bg-green-600 transition-colors"
        >
          Share!
        </button>
      </div>
    </div>
  );
} 