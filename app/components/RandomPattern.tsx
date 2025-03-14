/**
 * Component that displays a random pattern that changes daily
 */
"use client";

import { useState, useEffect } from "react";
import { Pattern } from "@/app/types";
import { PatternService } from "@/app/services/pattern.service";
import PatternCard from "./PatternCard";

export default function RandomPattern() {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    loadPattern();
  }, []);

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