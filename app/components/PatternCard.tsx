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
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-8">
        <div className="text-sm text-gray-500 mb-2">{today}</div>
        <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
          Pattern #{pattern.id}
        </div>
        <h2 className="mt-2 text-xl font-bold">{pattern.title}</h2>
        
        <div className="mt-4">
          <h3 className="font-semibold text-gray-700">Problem:</h3>
          <div className="mt-1 text-gray-600">
            <ReactMarkdown>{pattern.problem}</ReactMarkdown>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-gray-700">Solution:</h3>
          <div className="mt-1 text-gray-600">
            <ReactMarkdown>{pattern.solution}</ReactMarkdown>
          </div>
        </div>

        {pattern.relatedPatterns && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700">Related Patterns:</h3>
            <div className="mt-1 text-gray-600">
              <ReactMarkdown>{pattern.relatedPatterns}</ReactMarkdown>
            </div>
          </div>
        )}

        <div className="mt-6">
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