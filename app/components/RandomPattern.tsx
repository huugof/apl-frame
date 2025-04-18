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

// Add keyframe animation for bouncing arrow
const bounceKeyframes = `
@keyframes bounce {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-10px);
  }
}
`;

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
 * Truncates a string to a maximum length and adds an ellipsis if needed
 * @param str - The string to truncate
 * @param maxLength - The maximum length before truncation
 * @returns The truncated string with ellipsis if needed
 */
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return `${str.slice(0, maxLength - 3)}...`;
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
  const [hasAddedFrame, setHasAddedFrame] = useState(false);
  const [newPatternAvailable, setNewPatternAvailable] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRelatedModalOpen, setIsRelatedModalOpen] = useState(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isAddFramePromptOpen, setIsAddFramePromptOpen] = useState(false);
  const [relatedPatterns, setRelatedPatterns] = useState<Array<{ id: number; title: string }>>([]);
  const [bookmarkedPatterns, setBookmarkedPatterns] = useState<Array<{ id: number; title: string }>>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const relatedModalRef = useRef<HTMLDivElement>(null);
  const bookmarksModalRef = useRef<HTMLDivElement>(null);
  const aboutModalRef = useRef<HTMLDivElement>(null);
  const addFramePromptRef = useRef<HTMLDivElement>(null);
  const buttonWrapperRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const appUrl = process.env.NEXT_PUBLIC_URL;

  /**
   * Handle clicking outside the modals to close them
   */
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
      if (relatedModalRef.current && !relatedModalRef.current.contains(event.target as Node)) {
        setIsRelatedModalOpen(false);
      }
      if (bookmarksModalRef.current && !bookmarksModalRef.current.contains(event.target as Node)) {
        setIsBookmarksModalOpen(false);
      }
      if (aboutModalRef.current && !aboutModalRef.current.contains(event.target as Node)) {
        setIsAboutModalOpen(false);
      }
      if (addFramePromptRef.current && !addFramePromptRef.current.contains(event.target as Node)) {
        setIsAddFramePromptOpen(false);
      }
    };

    if (isModalOpen || isRelatedModalOpen || isBookmarksModalOpen || isAboutModalOpen || isAddFramePromptOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen, isRelatedModalOpen, isBookmarksModalOpen, isAboutModalOpen, isAddFramePromptOpen]);

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
    } catch (error) {
      console.error("Failed to navigate to pattern:", error);
    } finally {
      setIsLoading(false);
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
    setIsModalOpen(false); // Close the modal after sharing
  };

  /**
   * Handle new pattern button click
   */
  const handleNewPatternClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await loadPattern();
  };

  /**
   * Handle generate image button click
   */
  const handleGenerateImageClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await generatePatternImage();
  };

  /**
   * Calculate hours until next pattern (2pm EST)
   */
  const getHoursUntilNext = (): number => {
    const now = new Date();
    const next = new Date();
    next.setHours(14, 0, 0, 0); // 2pm EST
    // If it's past 2pm, get next day at 2pm
    if (now.getHours() >= 14) {
      next.setDate(next.getDate() + 1);
    }
    const diffHours = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60));
    return diffHours;
  };

  /**
   * Check if the current pattern is bookmarked
   */
  const checkBookmarkStatus = useCallback(async (patternId: number) => {
    try {
      if (!hasAddedFrame) return;
      
      const user = await sdk.context;
      if (!user?.user?.fid) return;
      
      const response = await fetch(`/api/bookmarks?patternId=${patternId}`, {
        headers: {
          "x-farcaster-fid": user.user.fid.toString(),
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to check bookmark status");
      }
      
      const data = await response.json();
      setIsBookmarked(data.isBookmarked);
    } catch (error) {
      console.error("Failed to check bookmark status:", error);
    }
  }, [hasAddedFrame]);

  /**
   * Toggle bookmark status for the current pattern
   */
  const toggleBookmark = async () => {
    try {
      if (!pattern || !hasAddedFrame) return;

      const user = await sdk.context;
      if (!user?.user?.fid) return;

      const action = isBookmarked ? "remove" : "add";
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-farcaster-fid": user.user.fid.toString(),
        },
        body: JSON.stringify({
          patternId: pattern.id,
          action,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to toggle bookmark");
      }
      
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    }
  };

  // Check bookmark status when pattern changes
  useEffect(() => {
    if (pattern) {
      checkBookmarkStatus(pattern.id);
    }
  }, [pattern, checkBookmarkStatus]);

  /**
   * Load bookmarked patterns
   */
  const loadBookmarkedPatterns = useCallback(async () => {
    try {
      if (!hasAddedFrame) return;

      const user = await sdk.context;
      if (!user?.user?.fid) return;

      const response = await fetch("/api/bookmarks", {
        headers: {
          "x-farcaster-fid": user.user.fid.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load bookmarks");
      }

      const data = await response.json();
      const patterns = await Promise.all(
        data.bookmarks.map(async (id: number) => {
          const patternResponse = await fetch(`/api/pattern/${id}`);
          if (!patternResponse.ok) return null;
          const pattern = await patternResponse.json();
          return {
            id: pattern.id,
            title: pattern.title,
          };
        })
      );

      setBookmarkedPatterns(patterns.filter((p): p is { id: number; title: string } => p !== null));
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
    }
  }, [hasAddedFrame]);

  // Load bookmarks when frame is added
  useEffect(() => {
    if (hasAddedFrame) {
      loadBookmarkedPatterns();
    }
  }, [hasAddedFrame, loadBookmarkedPatterns]);

  // Refresh bookmarks when bookmark status changes
  useEffect(() => {
    if (hasAddedFrame) {
      loadBookmarkedPatterns();
    }
  }, [isBookmarked, hasAddedFrame, loadBookmarkedPatterns]);

  // Initialize Frame SDK and load pattern
  useEffect(() => {
    const initializeFrame = async () => {
      try {
        // Get pattern ID from URL if present, otherwise use initialPatternId
        const patternId = searchParams.get("patternId") || initialPatternId?.toString();
        
        // Load pattern first
        await loadPattern(patternId ? parseInt(patternId, 10) : undefined);
        
        // Initialize Frame SDK
        if (sdk) {
          // Check if frame is already added
          const context = await sdk.context;
          if (context?.client?.added) {
            console.log("[Frame] Frame is already added");
            setHasAddedFrame(true);
          }

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

          // Tell the client we're ready
          sdk.actions.ready();
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
  }, [searchParams, initialPatternId]);

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
    <div className="relative min-h-screen bg-white">
      {/* Inject keyframe animation */}
      <style dangerouslySetInnerHTML={{ __html: bounceKeyframes }} />

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
      
      <div className={`pb-8 transition-all duration-300 ${isModalOpen || isRelatedModalOpen || isAboutModalOpen || isAddFramePromptOpen ? "blur-sm" : ""}`}>
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

      {/* Menu Modal */}
      <div 
        ref={modalRef}
        className={`fixed bottom-7 left-0 right-0 flex justify-center z-20 w-full transition-opacity duration-350 ${
          isModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-[90%] mx-auto">
          <div 
            className="bg-white rounded-[24px] shadow-2xl w-full p-6 transform transition-transform duration-350 ease-out origin-bottom" 
            style={{ 
              height: "45vh",
              transform: isModalOpen ? "scaleY(1)" : "scaleY(0)"
            }}
          >
            <div className={`flex flex-col h-full transition-opacity duration-350 ${
              isModalOpen ? "opacity-100" : "opacity-0"
            }`}>
              {pattern && (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Pattern {pattern.number}</h2>
                    <h3 className="text-md text-gray-600 mt-1">{pattern.title}</h3>
                  </div>
                </>
              )}
              <div className="w-full flex-1 space-y-2 overflow-y-auto">
                <button
                  onClick={handleShareClick}
                  className="px-10 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors w-full"
                >
                  Share!
                </button>
                <button
                  onClick={() => {
                    loadPattern();
                    setIsModalOpen(false);
                  }}
                  className="px-10 py-3 bg-[#e2e2e2] text-black rounded-xl hover:bg-blue-700 transition-colors w-full"
                >
                  Today's Pattern
                </button>
                <button
                  onClick={() => {
                    setIsAboutModalOpen(true);
                    setIsModalOpen(false);
                  }}
                  className="px-10 py-3 bg-[#e2e2e2] text-black rounded-xl hover:bg-blue-700 transition-colors w-full"
                >
                  About
                </button>
              </div>
              <div className="mt-4 text-sm text-gray-500 text-center">
                Next pattern in {getHoursUntilNext()} hours
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Patterns Modal */}
      <div 
        ref={relatedModalRef}
        className={`fixed bottom-7 left-0 right-0 flex justify-center z-20 w-full transition-opacity duration-350 ${
          isRelatedModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-[90%] mx-auto">
          <div 
            className="bg-white rounded-[24px] shadow-2xl w-full p-6 transform transition-transform duration-350 ease-out origin-bottom" 
            style={{ 
              maxHeight: "80vh",
              height: "fit-content",
              transform: isRelatedModalOpen ? "scaleY(1)" : "scaleY(0)"
            }}
          >
            <div className={`flex flex-col items-center gap-4 transition-opacity duration-350 ${
              isRelatedModalOpen ? "opacity-100" : "opacity-0"
            }`}>
              <div className="text-center mb-2">
                <h2 className="text-2xl font-bold text-gray-800">Related Patterns</h2>
              </div>
              <div className="w-full overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="flex flex-wrap gap-2">
                  {relatedPatterns.map((related) => (
                    <button
                      key={related.id}
                      onClick={() => {
                        navigateToPattern(related.id);
                        setIsRelatedModalOpen(false);
                      }}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                      title={related.title}
                    >
                      {related.id}. {truncateString(related.title, 18)}
                    </button>
                  ))}
                  {relatedPatterns.length === 0 && (
                    <p className="text-center text-gray-500 w-full">No related patterns found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Frame Prompt Modal */}
      <div 
        ref={addFramePromptRef}
        className={`fixed top-0 left-0 right-0 flex justify-center z-20 w-full transition-opacity ${
          isAddFramePromptOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-[75%] mx-auto h-screen flex items-center justify-center -mt-20">
          <div className="text-center">
            <span className="text-3xl font-bold text-red [animation:subtlePulse_3s_ease-in-out_infinite]">Add <strong>A Pattern Language Daily</strong> to unlock bookmarks!</span>
          </div>
        </div>
        <style jsx>{`
          @keyframes subtlePulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.9; }
          }
        `}</style>
      </div>

      {/* Bookmarks Modal - Update to only show when frame is added */}
      <div 
        ref={bookmarksModalRef}
        className={`fixed bottom-7 left-0 right-0 flex justify-center z-20 w-full transition-opacity duration-350 ${
          hasAddedFrame && isBookmarksModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-[90%] mx-auto">
          <div 
            className="bg-white rounded-[24px] shadow-2xl w-full p-6 transform transition-transform duration-350 ease-out origin-bottom" 
            style={{ 
              maxHeight: "80vh",
              height: "fit-content",
              transform: isBookmarksModalOpen ? "scaleY(1)" : "scaleY(0)"
            }}
          >
            <div className={`flex flex-col items-center gap-4 transition-opacity duration-350 ${
              isBookmarksModalOpen ? "opacity-100" : "opacity-0"
            }`}>
              <div className="text-center mb-2">
                <h2 className="text-2xl font-bold text-gray-800">Your Bookmarks</h2>
              </div>
              <div className="w-full overflow-y-auto max-h-[calc(80vh-120px)]">
                {hasAddedFrame ? (
                  <>
                    <div className="mb-4">
                      <button
                        onClick={async () => {
                          await toggleBookmark();
                          setIsBookmarksModalOpen(false);
                        }}
                        className="w-full px-6 py-3 bg-[#e2e2e2] text-black rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>{isBookmarked ? "Remove Bookmark" : "Add Bookmark"}</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {bookmarkedPatterns.map((pattern) => (
                        <button
                          key={pattern.id}
                          onClick={() => {
                            navigateToPattern(pattern.id);
                            setIsBookmarksModalOpen(false);
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                          title={pattern.title}
                        >
                          {pattern.id}. {truncateString(pattern.title, 18)}
                        </button>
                      ))}
                      {bookmarkedPatterns.length === 0 && (
                        <p className="text-center text-gray-500 w-full">No bookmarked patterns yet</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-center text-gray-600">Add frame to bookmark patterns</p>
                    <button
                      onClick={async () => {
                        if (!hasAddedFrame) {
                          console.log("Opening add frame prompt");
                          setIsAddFramePromptOpen(true);
                          try {
                            const result = await sdk.actions.addFrame() as AddFrameResult;
                            if (result.added) {
                              setHasAddedFrame(true);
                              setIsAddFramePromptOpen(false);
                              setIsBookmarksModalOpen(true);
                            } else {
                              setIsAddFramePromptOpen(false);
                            }
                          } catch (error: any) {
                            console.log("Full error object:", error);
                            console.log("Error message:", error.message);
                            console.log("Error type:", error.constructor.name);
                            // Close the prompt for any error since we know the user rejected it
                            console.log("Closing add frame prompt due to error");
                            setIsAddFramePromptOpen(false);
                          }
                        } else {
                          setIsBookmarksModalOpen(true);
                        }
                      }}
                      className={`w-12 h-12 bg-[#f5f5f5] text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors ${
                        isBookmarked ? "text-blue-600" : ""
                      }`}
                      aria-label="View bookmarks"
                    >
                      <div className="flex items-center gap-2">
                        <img 
                          src="/bookmark-icon.svg" 
                          alt="Bookmarks" 
                          className={`w-6 h-6 ${isBookmarked ? "[filter:invert(41%)_sepia(98%)_saturate(4272%)_hue-rotate(199deg)_brightness(97%)_contrast(96%)]" : "[filter:brightness(0)_opacity(60%)]"}`}
                        />
                        <span className={`text-lg font-medium ${isBookmarked ? "text-blue-600" : "text-gray-600"}`}>
                          {bookmarkedPatterns.length}
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Modal */}
      <div 
        ref={aboutModalRef}
        className={`fixed bottom-7 left-0 right-0 flex justify-center z-20 w-full transition-opacity duration-350 ${
          isAboutModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-[90%] mx-auto">
          <div 
            className="bg-white rounded-[24px] shadow-2xl w-full p-6 transform transition-transform duration-350 ease-out origin-bottom" 
            style={{ 
              height: "45vh",
              transform: isAboutModalOpen ? "scaleY(1)" : "scaleY(0)"
            }}
          >
            <div className={`flex flex-col h-full transition-opacity duration-350 ${
              isAboutModalOpen ? "opacity-100" : "opacity-0"
            }`}>
              <div className="w-full flex-1 overflow-y-auto text-left space-y-4 px-1">
                <p className="text-gray-700">
                <i>A Pattern Language</i> by Christopher Alexander is a book on architecture and urban design that presents 253 design principles—"patterns"—for creating livable, human-centered spaces. It's a guide for shaping everything from rooms to cities.                </p>
                <div className="space-y-2">
                  <p className="text-gray-600 text-sm">Learn more about the book: {""}
                  <button
                    onClick={() => sdk.actions.openUrl("https://www.patternlanguage.com/")}
                    className="text-blue-600 hover:underline"
                  >
                    patternlanguage.com
                  </button>
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600 text-sm italic">
                    This frame is repackaged from the{" "}
                    <button
                      onClick={() => sdk.actions.openUrl("https://github.com/zenodotus280/apl-md/tree/master")}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      markdown version
                    </button>
                    {" "}by @zenodotus280
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="fixed bottom-7 left-0 right-0 flex justify-center">
        <div ref={buttonWrapperRef} className="w-[90%] flex items-center justify-center gap-16 bg-[#f5f5f5] px-6 py-3 rounded-full shadow-xl">
          <button
            onClick={async () => {
              if (!hasAddedFrame) {
                console.log("Opening add frame prompt");
                setIsAddFramePromptOpen(true);
                try {
                  const result = await sdk.actions.addFrame() as AddFrameResult;
                  if (result.added) {
                    setHasAddedFrame(true);
                    setIsAddFramePromptOpen(false);
                    setIsBookmarksModalOpen(true);
                  } else {
                    setIsAddFramePromptOpen(false);
                  }
                } catch (error: any) {
                  console.log("Full error object:", error);
                  console.log("Error message:", error.message);
                  console.log("Error type:", error.constructor.name);
                  // Close the prompt for any error since we know the user rejected it
                  console.log("Closing add frame prompt due to error");
                  setIsAddFramePromptOpen(false);
                }
              } else {
                setIsBookmarksModalOpen(true);
              }
            }}
            className={`w-12 h-12 bg-[#f5f5f5] text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors ${
              isBookmarked ? "text-blue-600" : ""
            }`}
            aria-label="View bookmarks"
          >
            <div className="flex items-center gap-2">
              <img 
                src="/bookmark-icon.svg" 
                alt="Bookmarks" 
                className={`w-6 h-6 ${isBookmarked ? "[filter:invert(41%)_sepia(98%)_saturate(4272%)_hue-rotate(199deg)_brightness(97%)_contrast(96%)]" : "[filter:brightness(0)_opacity(60%)]"}`}
              />
              <span className={`text-lg font-medium ${isBookmarked ? "text-blue-600" : "text-gray-600"}`}>
                {bookmarkedPatterns.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setIsRelatedModalOpen(!isRelatedModalOpen)}
            className="w-12 h-12 bg-[#f5f5f5] text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <img src="/related-icon.svg" alt="Related patterns" className="w-6 h-6 [filter:brightness(0)_opacity(60%)]" />
          </button>
          <button
            onClick={() => setIsModalOpen(!isModalOpen)}
            className="w-12 h-12 bg-[#f5f5f5] text-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Open menu"
          >
            <img src="/menu-icon.svg" alt="Menu" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}