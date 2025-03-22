import { Pattern } from "@/app/types";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

/**
 * Props for the PatternCard component
 */
interface PatternCardProps {
  pattern: Pattern;
  imageUrl: string | null;
  isLoading: boolean;
  onGenerateImage: () => Promise<void>;
  relatedPatterns: Array<{ id: number; title: string }>;
  onNavigateToPattern: (patternId: number) => Promise<void>;
}

/**
 * Card component to display a single pattern
 */
export default function PatternCard({ 
  pattern, 
  imageUrl, 
  isLoading, 
  onGenerateImage,
  relatedPatterns,
  onNavigateToPattern
}: PatternCardProps) {
  // Format today's date
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="max-w-2xl mx-auto bg-white overflow-hidden">
      {/* Blue gradient section with pattern info */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 px-8 py-10">
        <div className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 mb-3">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Pattern {pattern.id}
          </span>
        </div>
        <h2 className="text-4xl font-normal text-gray-900 dark:text-white tracking-tight font-garamond">
          {pattern.name}
        </h2>
      </div>

      {/* Date display */}
      <div className="px-8 pt-4 mb-6">
        <div className="text-sm text-gray-500">{today}</div>
      </div>

      {/* Pattern content */}
      <div className="px-8 pb-8">
        {/* Problem */}
        <div className="mb-8">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Problem</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{pattern.problem}</p>
        </div>

        {/* Solution */}
        <div className="mb-8">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Solution</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{pattern.solution}</p>
        </div>

        {/* Related Patterns */}
        {relatedPatterns.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Related Patterns</h3>
            <div className="flex flex-wrap gap-2">
              {relatedPatterns.map((related) => (
                <button
                  key={related.id}
                  onClick={() => onNavigateToPattern(related.id)}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 
                           rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800 
                           transition-colors"
                >
                  {related.title} ({related.id})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image section */}
        <div className="mt-8">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Visualization of ${pattern.title}`}
              className="w-full rounded-lg shadow-lg"
            />
          ) : (
            <button
              onClick={onGenerateImage}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-medium
                       hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Generating image..." : "Generate image"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 