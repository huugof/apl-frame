import { Pattern } from "@/app/types";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

export interface PatternCardProps {
  pattern: Pattern;
  imageUrl: string | null;
  isLoading: boolean;
  onGenerateImage: () => void;
}

/**
 * Card component to display a single pattern
 */
export default function PatternCard({ pattern, imageUrl, isLoading, onGenerateImage }: PatternCardProps) {
  // Format today's date
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md overflow-hidden">
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
      <div className="px-8">
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Problem:</h3>
          <div className="mt-2 pl-4 text-gray-700 dark:text-gray-300 prose prose-gray dark:prose-invert border-l-2 border-gray-100 dark:border-gray-700">
            <ReactMarkdown>{pattern.problem}</ReactMarkdown>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Solution:</h3>
          <div className="mt-2 pl-4 text-gray-700 dark:text-gray-300 prose prose-gray dark:prose-invert border-l-2 border-gray-100 dark:border-gray-700">
            <ReactMarkdown>{pattern.solution}</ReactMarkdown>
          </div>
        </div>

        <div className="mt-6 pb-8">
          {imageUrl ? (
            <div className="relative h-64 w-full">
              <Image
                src={imageUrl}
                alt={`Visualization of ${pattern.title}`}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          ) : (
            <button
              onClick={onGenerateImage}
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? "Generating image..." : "Generate visualization"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 