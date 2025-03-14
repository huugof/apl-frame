import { NextResponse } from "next/server";
import { Pattern } from "@/app/types";
import { patterns } from "@/app/data/patterns";

/**
 * Get the daily pattern based on the current date
 */
export async function GET() {
  try {
    // Get today's date and use it to generate a consistent index
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const hash = Array.from(dateString).reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Use the hash to select a pattern
    const index = Math.abs(hash) % patterns.length;
    const pattern = patterns[index];

    return NextResponse.json({ pattern });
  } catch (error) {
    console.error("Failed to get daily pattern:", error);
    return NextResponse.json(
      { error: "Failed to get daily pattern" },
      { status: 500 }
    );
  }
} 