/**
 * Component that displays a random pattern that changes daily
 */
"use client";

import { useState, useEffect } from "react";
import { Pattern } from "@/app/types";
import { PatternService } from "@/app/services/pattern.service";
import PatternCard from "./PatternCard";
import sdk from "@farcaster/frame-sdk";

export default function RandomPattern() {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  const loadPattern = async () => {
    try {
      const dailyPattern = await PatternService.getDailyPattern();
      setPattern(dailyPattern);
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

  // Initialize Frame SDK and load pattern
  useEffect(() => {
    const initializeFrame = async () => {
      try {
        // Load pattern first
        await loadPattern();
        
        // Initialize Frame SDK
        if (sdk && !isSDKLoaded) {
          setIsSDKLoaded(true);
          // Tell the client we're ready and can hide the splash screen
          sdk.actions.ready();
        }
      } catch (error) {
        console.error("Failed to initialize frame:", error);
      }
    };

    initializeFrame();
  }, [isSDKLoaded]);

  if (!pattern) {
    return <div>Loading pattern...</div>;
  }

  return (
    <PatternCard
      pattern={pattern}
      imageUrl={imageUrl}
      isLoading={isLoading}
      onGenerateImage={generatePatternImage}
    />
  );
} 