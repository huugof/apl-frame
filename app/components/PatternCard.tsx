import { Pattern } from "@/app/types";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

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
  return (
    <div className="max-w-2xl mx-auto bg-white">
      {/* Blue gradient section with pattern info */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 px-8 py-10">
        <div className="inline-block px-3 py-1 rounded-full bg-blue-100 mb-4">
          <span className="text-sm font-medium text-blue-700">
            Pattern {pattern.id}
          </span>
        </div>
        <h2 className="text-4xl font-normal text-gray-900 tracking-tight font-garamond">
          {pattern.name}
        </h2>
      </div>

      {/* Pattern content */}
      <div className="px-8">
        {/* Problem */}
        <div className="mb-8">
          <h3 className="text-xl font-medium text-gray-900 mt-8 mb-4">Problem</h3>
          <p className="text-gray-700 whitespace-pre-line">{pattern.problem}</p>
        </div>

        {/* Solution */}
        <div className="mb-16">
          <h3 className="text-xl font-medium text-gray-900 mb-4">Solution</h3>
          <p className="text-gray-700 whitespace-pre-line">{pattern.solution}</p>
        </div>

        {/* Related Patterns
        {relatedPatterns.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-medium text-gray-900 mb-4">Related Patterns</h3>
            <div className="flex flex-wrap gap-2">
              {relatedPatterns.map((related) => (
                <button
                  key={related.id}
                  onClick={() => onNavigateToPattern(related.id)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 
                           rounded-full text-sm font-medium hover:bg-blue-200 
                           transition-colors"
                  title={related.title}
                >
                  {truncateString(related.title, 18)} ({related.id})
                </button>
              ))}
            </div>
          </div>
        )} */}

        {/* Image section */}
        <div className="mt-8">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={`Visualization of ${pattern.title}`}
              className="w-full rounded-lg shadow-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
} 